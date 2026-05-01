import { Controller, Get, Param, Query } from '@nestjs/common';
import { CarsService } from './cars.service';

@Controller('api/cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  async getCars(@Query('status') status?: string) {
    return this.carsService.getAllCars(status);
  }

  @Get(':id')
  async getCarById(@Param('id') id: string) {
    return this.carsService.getCarById(id);
  }
}
