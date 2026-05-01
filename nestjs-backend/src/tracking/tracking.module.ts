import { Module } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { GpsWorkerService } from './gps-worker.service';

@Module({
  providers: [TrackingGateway, GpsWorkerService],
  exports: [TrackingGateway],
})
export class TrackingModule {}
