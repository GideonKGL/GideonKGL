import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

const createPrismaClient = () =>
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"]
  });

// Singleton: reuse a single PrismaClient for the whole process. In development
// the module graph can be re-evaluated on hot reload, which would otherwise
// create a new client (and a new connection pool) on every reload and exhaust
// the database's connection limit. Caching the instance on globalThis prevents
// that. In production a module is only evaluated once, so the cache is skipped.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
