import { Queue, Worker, Job } from 'bullmq';
import { getRedisClient, getRedisOrFallback } from './redis';
import { sendEmail } from './email';
import { prisma } from './prisma';
import { emitNotification } from './socket';

const NOTIFICATION_QUEUE_NAME = 'notifications';
const EMAIL_QUEUE_NAME = 'email-notifications';
const SMS_QUEUE_NAME = 'sms-notifications';
const WHATSAPP_QUEUE_NAME = 'whatsapp-notifications';

let notificationQueue: Queue | null = null;
let emailQueue: Queue | null = null;
let smsQueue: Queue | null = null;
let whatsappQueue: Queue | null = null;

export interface NotificationJobData {
  notificationId: string;
  userId: string;
  type: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'IN_APP';
  title: string;
  message: string;
  html?: string;
  to?: string;
  retryCount?: number;
  maxRetries?: number;
}

export async function getNotificationQueue(): Promise<Queue> {
  if (notificationQueue) return notificationQueue;

  const redis = await getRedisOrFallback();
  if (!redis) {
    throw new Error('Redis not available for notification queue');
  }

  notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 3600,
        count: 100,
      },
      removeOnFail: {
        age: 24 * 3600,
      },
    },
  });

  return notificationQueue;
}

export async function getEmailQueue(): Promise<Queue> {
  if (emailQueue) return emailQueue;

  const redis = await getRedisOrFallback();
  if (!redis) {
    throw new Error('Redis not available for email queue');
  }

  emailQueue = new Queue(EMAIL_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 10000,
      },
    },
  });

  return emailQueue;
}

export async function queueNotification(data: NotificationJobData): Promise<Job> {
  const queue = await getNotificationQueue();

  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type as any,
      channel: data.channel,
      title: data.title,
      message: data.message,
      html: data.html,
      status: 'PENDING',
      maxRetries: data.maxRetries || 3,
    },
  });

  return queue.add('send-notification', {
    ...data,
    notificationId: notification.id,
  });
}

export async function queueEmail(to: string, subject: string, html: string): Promise<Job> {
  const queue = await getEmailQueue();

  return queue.add('send-email', {
    to,
    subject,
    html,
  });
}

export async function queueBookingConfirmation(userId: string, bookingId: string, bookingDetails: any): Promise<void> {
  await queueNotification({
    notificationId: '',
    userId,
    type: 'BOOKING',
    channel: 'EMAIL',
    title: 'Booking Confirmed',
    message: `Your booking ${bookingId} has been confirmed.`,
    html: generateBookingConfirmationEmail(bookingDetails),
  });
}

export async function queuePaymentSuccess(userId: string, paymentId: string, amount: number): Promise<void> {
  await queueNotification({
    notificationId: '',
    userId,
    type: 'PAYMENT',
    channel: 'EMAIL',
    title: 'Payment Received',
    message: `Payment of $${amount.toFixed(2)} AUD has been processed successfully.`,
  });
}

export async function queueBookingReminder(userId: string, bookingId: string, pickupDate: Date): Promise<void> {
  const hoursUntilPickup = Math.ceil((pickupDate.getTime() - Date.now()) / (1000 * 60 * 60));

  await queueNotification({
    notificationId: '',
    userId,
    type: 'REMINDER',
    channel: 'EMAIL',
    title: 'Booking Reminder',
    message: `Your booking starts in ${hoursUntilPickup} hours.`,
  });
}

export async function startNotificationWorkers(): Promise<void> {
  const redis = await getRedisOrFallback();
  if (!redis) {
    console.warn('[Queue] Redis not available, notification workers not started');
    return;
  }

  // Notification worker
  const notificationWorker = new Worker(
    NOTIFICATION_QUEUE_NAME,
    async (job: Job) => {
      const data = job.data as NotificationJobData;
      await processNotification(data);
    },
    { connection: redis, concurrency: 5 }
  );

  notificationWorker.on('completed', (job) => {
    console.log(`[Queue] Notification job ${job.id} completed`);
  });

  notificationWorker.on('failed', (job, err) => {
    console.error(`[Queue] Notification job ${job?.id} failed:`, err.message);
  });

  // Email worker
  const emailWorker = new Worker(
    EMAIL_QUEUE_NAME,
    async (job: Job) => {
      const { to, subject, html } = job.data;
      await sendEmail({ to, subject, html });
    },
    { connection: redis, concurrency: 3 }
  );

  emailWorker.on('completed', (job) => {
    console.log(`[Queue] Email job ${job.id} completed`);
  });

  emailWorker.on('failed', (job, err) => {
    console.error(`[Queue] Email job ${job?.id} failed:`, err.message);
  });

  console.log('[Queue] Notification workers started');
}

async function processNotification(data: NotificationJobData): Promise<void> {
  const { notificationId, userId, channel, title, message, html } = data;

  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Emit real-time notification via Socket.io
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (notification) {
      emitNotification({
        id: parseInt(notification.id) || 0,
        userId: parseInt(userId) || 0,
        title: notification.title,
        message: notification.message,
        type: notification.type as any,
        createdAt: notification.createdAt.toISOString(),
      });
    }

    // If email channel, also queue the actual email send
    if (channel === 'EMAIL') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, notificationPrefs: true },
      });

      if (user?.email && user.notificationPrefs?.emailEnabled) {
        await queueEmail(user.email, title, html || message);
      }
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`[Queue] Error processing notification ${notificationId}:`, error);

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: { increment: 1 },
      },
    });

    throw error;
  }
}

function generateBookingConfirmationEmail(booking: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Booking Confirmed!</h2>
      <p>Dear ${booking.customerName},</p>
      <p>Your booking has been confirmed with the following details:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Booking ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.id}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.car.make} ${booking.car.model} ${booking.car.year}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Pickup:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(booking.pickupDate).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Dropoff:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(booking.dropoffDate).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Location:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.pickupLocation}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Total:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">$${booking.totalAmount.toFixed(2)} AUD</td></tr>
      </table>
      <p>Thank you for choosing AusDrive Premium!</p>
      <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply.</p>
    </div>
  `;
}
