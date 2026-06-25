import { PrismaClient } from "@prisma/client";
import { logger } from "../config/logger";

export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? [
          { emit: "event", level: "query" },
          { emit: "event", level: "warn" },
          { emit: "event", level: "error" }
        ]
      : [
          { emit: "event", level: "warn" },
          { emit: "event", level: "error" }
        ]
});

prisma.$on("query", (event) => {
  logger.debug({ query: event.query, duration: event.duration }, "Prisma query");
});

prisma.$on("warn", (event) => {
  logger.warn({ message: event.message }, "Prisma warning");
});

prisma.$on("error", (event) => {
  logger.error({ message: event.message }, "Prisma error");
});

export const connectDatabase = async (): Promise<void> => {
  await prisma.$connect();
  logger.info("Connected to PostgreSQL");
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info("Disconnected from PostgreSQL");
};
