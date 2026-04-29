import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

const prismaOptions: any = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
};

// Use accelerateUrl for Prisma 7 to avoid Node.js dependencies in browser
prismaOptions.accelerateUrl = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/ausdrive?sslmode=disable";

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Prevent this module from being bundled for the browser
if (typeof window !== 'undefined') {
  throw new Error('Prisma client should only be used on the server side');
}
