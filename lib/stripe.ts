import Stripe from 'stripe';
import { prisma } from './prisma';
import { pricingService } from './pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-04-22.dahlia',
});

interface PaymentIntentData {
  bookingId: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

interface WebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

class StripeService {
  async createPaymentIntent(data: PaymentIntentData): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    try {
      const { bookingId, amount, currency = 'aud', metadata = {} } = data;

      // Verify booking exists
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          car: true,
          user: true
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          bookingId,
          userId: booking.userId,
          carId: booking.carId,
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
        description: `AusDrive Premium - ${booking.car.make} ${booking.car.model} rental`,
        receipt_email: booking.user.email,
      });

      // Update booking with payment intent ID
      await prisma.payment.upsert({
        where: { bookingId },
        update: {
          stripePaymentId: paymentIntent.id,
          amount,
          currency,
          status: 'PENDING'
        },
        create: {
          bookingId,
          stripePaymentId: paymentIntent.id,
          amount,
          currency,
          status: 'PENDING',
          paymentMethod: 'card'
        }
      });

      return {
        clientSecret: paymentIntent.client_secret || '',
        paymentIntentId: paymentIntent.id
      };
    } catch (error: any) {
      console.error('[Stripe] Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<{
    success: boolean;
    bookingId?: string;
    error?: string;
  }> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        const bookingId = paymentIntent.metadata?.bookingId;
        
        if (bookingId) {
          // Update payment status
          await prisma.payment.updateMany({
            where: { stripePaymentId: paymentIntentId },
            data: { status: 'COMPLETED' }
          });

          // Update booking status
          await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CONFIRMED' }
          });

          return {
            success: true,
            bookingId
          };
        }
      }

      return {
        success: false,
        error: `Payment not successful. Status: ${paymentIntent.status}`
      };
    } catch (error: any) {
      console.error('[Stripe] Error confirming payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<{
    success: boolean;
    refundId?: string;
    error?: string;
  }> {
    try {
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentId: paymentIntentId },
        include: { booking: true }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Create refund
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await stripe.refunds.create(refundParams);

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' }
      });

      // Update booking status
      if (payment.booking) {
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CANCELLED' }
        });
      }

      return {
        success: true,
        refundId: refund.id
      };
    } catch (error: any) {
      console.error('[Stripe] Error processing refund:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleWebhook(event: WebhookEvent): Promise<{
    processed: boolean;
    error?: string;
  }> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object);
          break;
        
        default:
          console.log(`[Stripe] Unhandled event type: ${event.type}`);
      }

      return { processed: true };
    } catch (error: any) {
      console.error('[Stripe] Error handling webhook:', error);
      return {
        processed: false,
        error: error.message
      };
    }
  }

  private async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (!bookingId) {
      console.error('[Stripe] No booking ID in payment intent metadata');
      return;
    }

    // Update payment status
    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: 'COMPLETED' }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' }
    });

    // Get booking details for notification
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        car: true,
        user: true
      }
    });

    if (booking) {
      // Send payment success notification
      // This would integrate with your Firebase service
      console.log(`[Stripe] Payment succeeded for booking ${bookingId}`);
      // await firebaseService.sendPaymentSuccess(booking.userId, {
      //   amount: paymentIntent.amount / 100,
      //   bookingId
      // });
    }
  }

  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (!bookingId) {
      console.error('[Stripe] No booking ID in payment intent metadata');
      return;
    }

    // Update payment status
    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: 'FAILED' }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'PENDING' } // Reset to pending for retry
    });

    console.log(`[Stripe] Payment failed for booking ${bookingId}: ${paymentIntent.last_payment_error?.message}`);
  }

  private async handlePaymentCanceled(paymentIntent: any): Promise<void> {
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (!bookingId) {
      console.error('[Stripe] No booking ID in payment intent metadata');
      return;
    }

    // Update payment status
    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: 'CANCELED' }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' }
    });

    console.log(`[Stripe] Payment canceled for booking ${bookingId}`);
  }

  async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error: any) {
      console.error('[Stripe] Error fetching payment methods:', error);
      throw new Error(`Failed to fetch payment methods: ${error.message}`);
    }
  }

  async createCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId
        }
      });

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id }
      });

      return customer.id;
    } catch (error: any) {
      console.error('[Stripe] Error creating customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  async calculateBookingTotal(bookingData: {
    carId: string;
    pickupDate: Date;
    dropoffDate: Date;
    pickupLocation: string;
    distance?: number;
    promoCode?: string;
  }): Promise<{
    total: number;
    breakdown: any;
  }> {
    try {
      const pricing = await pricingService.calculateDynamicPrice(bookingData);
      
      return {
        total: pricing.totalPrice,
        breakdown: pricing.breakdown
      };
    } catch (error: any) {
      console.error('[Stripe] Error calculating booking total:', error);
      throw new Error(`Failed to calculate total: ${error.message}`);
    }
  }
}

export const stripeService = new StripeService();
