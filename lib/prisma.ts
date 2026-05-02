type GenericPrismaClient = Record<string, unknown>;

const globalForPrisma = globalThis as unknown as {
  prisma: GenericPrismaClient | undefined;
};

function createPrismaClient(): GenericPrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  // Use runtime loading to avoid compile-time coupling to Prisma-generated typings.
  const { PrismaClient } = require("@prisma/client") as {
    PrismaClient: new (options?: Record<string, unknown>) => GenericPrismaClient;
  };
  const { PrismaPg } = require("@prisma/adapter-pg") as {
    PrismaPg: new (options: { connectionString: string }) => unknown;
  };

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "pretty",
  });
}

export const prisma: any = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
