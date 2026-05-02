// Prisma v7 requires a database adapter (@prisma/adapter-pg or similar).
// The Next.js app uses raw pg queries via lib/db.ts instead.
// This file is kept as a placeholder to avoid import errors in any future use.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "pretty",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
