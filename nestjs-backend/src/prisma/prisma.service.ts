import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';

@Injectable()
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private _client: any = null;

  constructor() {
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in target) return (target as any)[prop];
        if (target._client && prop in target._client) {
          const value = target._client[prop];
          return typeof value === 'function' ? value.bind(target._client) : value;
        }
        return undefined;
      },
    });
  }

  get client(): any {
    return this._client;
  }

  async onModuleInit() {
    const { PrismaClient } = await import('@prisma/client');
    this._client = new (PrismaClient as any)();
    await this._client.$connect();
  }

  async onModuleDestroy() {
    if (this._client) {
      await this._client.$disconnect();
    }
  }
}

// Merge the class with the PrismaClient interface for TypeScript support
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/no-empty-object-type
export interface PrismaService extends PrismaClient {}
