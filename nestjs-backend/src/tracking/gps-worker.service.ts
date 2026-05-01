import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GpsWorkerService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout;

  // Base coordinates for Sydney, Australia
  private baseLat = -33.8688;
  private baseLng = 151.2093;

  constructor(
    private trackingGateway: TrackingGateway,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.startSimulation();
    console.log('[GPS Worker] Simulation started');
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private startSimulation() {
    // Every 5 seconds, simulate GPS updates for cars that are currently rented
    this.intervalId = setInterval(async () => {
      try {
        // Find bookings that are currently ongoing
        const activeBookings = await this.prisma.booking.findMany({
          where: {
            status: 'ACTIVE', // Assuming ACTIVE means currently rented out
          },
          select: { carId: true }
        });

        // For each active car, generate a slight movement
        for (const booking of activeBookings) {
          // Generate a small random offset (approx 5-10 meters)
          const latOffset = (Math.random() - 0.5) * 0.0005;
          const lngOffset = (Math.random() - 0.5) * 0.0005;
          
          const newLat = this.baseLat + latOffset;
          const newLng = this.baseLng + lngOffset;
          
          // Random speed between 20 and 60 km/h
          const speed = Math.floor(Math.random() * 40) + 20;

          // Broadcast through gateway
          await this.trackingGateway.broadcastCarLocation(
            booking.carId,
            newLat,
            newLng,
            speed
          );
        }
      } catch (error) {
        console.error('[GPS Worker] Error simulating GPS:', error);
      }
    }, 5000);
  }
}
