import { Controller, Post, Body, Get, Req, UnauthorizedException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Controller('api/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  private extractUserFromToken(req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      return decoded;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post()
  async createBooking(@Req() req: Request, @Body() data: any) {
    const user = this.extractUserFromToken(req);
    const isAdmin = ['ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(user.role);
    return this.bookingsService.createBooking(data, user.sub, isAdmin);
  }

  @Get()
  async getBookings(@Req() req: Request) {
    const user = this.extractUserFromToken(req);
    const isAdmin = ['ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(user.role);
    
    if (isAdmin) {
      return this.bookingsService.getAllBookings();
    } else {
      return this.bookingsService.getUserBookings(user.sub);
    }
  }
}
