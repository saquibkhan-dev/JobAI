import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton to avoid exhausting Postgres connections
// on hot-reload (each reload would otherwise instantiate a new PrismaClient).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
