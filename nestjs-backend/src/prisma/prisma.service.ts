import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// Prisma v7: import from generated output path, not '@prisma/client'
// PrismaClient can no longer be extended as a class in v7 — use composition.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrismaClient = any;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _client: AnyPrismaClient = null;

  get client(): AnyPrismaClient {
    return this._client;
  }

  async onModuleInit() {
    // Dynamic import so this doesn't break the root Next.js build
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
