import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TrackingModule } from './tracking/tracking.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { CarsModule } from './cars/cars.module';

@Module({
  imports: [PrismaModule, TrackingModule, AuthModule, BookingsModule, CarsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
