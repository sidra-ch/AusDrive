import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CarsService {
  constructor(private prisma: PrismaService) {}

  async getAllCars(status?: string) {
    const whereClause = status ? { status } : {};
    return this.prisma.car.findMany({
      where: whereClause,
    });
  }

  async getCarById(id: string) {
    const car = await this.prisma.car.findUnique({
      where: { id },
    });

    if (!car) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }

    return car;
  }
}
