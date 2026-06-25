import { performance } from "node:perf_hooks";
import { logger } from "./logger.js";
import { prisma } from "./prisma.js";

export type DatabaseHealth = {
  status: "connected" | "failed";
  responseTimeMs: number;
  error?: string;
};

const elapsedMs = (startedAt: number) => Math.round((performance.now() - startedAt) * 100) / 100;

/**
 * Establish and verify the database connection during startup.
 *
 * `$connect()` opens the pool and `SELECT 1` proves the credentials and network
 * path actually work (important for managed providers such as Render where the
 * external connection string must be reachable and SSL-capable). Throws on
 * failure so the caller can fail fast before the HTTP server starts.
 */
export const connectDatabase = async (): Promise<DatabaseHealth> => {
  const startedAt = performance.now();
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    const responseTimeMs = elapsedMs(startedAt);
    logger.info("Database connection established", { status: "connected", responseTimeMs });
    return { status: "connected", responseTimeMs };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Database connection failed", { status: "failed", error: message });
    throw new Error(`Unable to connect to the database: ${message}`);
  }
};

/**
 * Lightweight liveness check used by the health endpoint. Never throws: it
 * always resolves with the connection status and the measured round-trip time.
 */
export const checkDatabaseConnection = async (): Promise<DatabaseHealth> => {
  const startedAt = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "connected", responseTimeMs: elapsedMs(startedAt) };
  } catch (error) {
    return {
      status: "failed",
      responseTimeMs: elapsedMs(startedAt),
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};
