import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async createBooking(data: any, userId: string, isAdmin: boolean = false) {
    const { carId, pickupDate, returnDate, pickupLocation, notes } = data;

    const pickup = new Date(pickupDate);
    const dropoff = new Date(returnDate);

    if (isNaN(pickup.getTime()) || isNaN(dropoff.getTime()) || dropoff <= pickup) {
      throw new BadRequestException('Invalid date range');
    }

    // 1. Check for overlapping bookings
    const conflict = await this.prisma.booking.findFirst({
      where: {
        carId,
        status: { notIn: ['CANCELLED'] },
        OR: [
          {
            pickupDate: { lt: dropoff },
            dropoffDate: { gt: pickup },
          }
        ]
      }
    });

    if (conflict) {
      throw new ConflictException('Car not available for this period');
    }

    // 2. Determine initial status
    const initialStatus = isAdmin ? 'PENDING' : 'PENDING_PAYMENT';

    // 3. Create the booking
    const booking = await this.prisma.booking.create({
      data: {
        userId,
        carId,
        pickupDate: pickup,
        dropoffDate: dropoff,
        pickupLocation: pickupLocation || 'Main Branch',
        dropoffLocation: pickupLocation || 'Main Branch',
        status: initialStatus,
        totalPrice: 100,
        pricePerDay: 50,
      }
    });

    return {
      booking,
      message: isAdmin ? 'Booking created.' : 'Booking created. Payment required to confirm.',
      paymentRequired: !isAdmin
    };
  }

  async getUserBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: { car: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllBookings() {
    return this.prisma.booking.findMany({
      include: { car: true, user: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}
