import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    private _client;
    constructor();
    get client(): any;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
export interface PrismaService extends PrismaClient {
}
