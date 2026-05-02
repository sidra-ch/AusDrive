import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { PrismaService } from '../prisma/prisma.service';
export declare class GpsWorkerService implements OnModuleInit, OnModuleDestroy {
    private trackingGateway;
    private prisma;
    private intervalId;
    private baseLat;
    private baseLng;
    constructor(trackingGateway: TrackingGateway, prisma: PrismaService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private startSimulation;
}
