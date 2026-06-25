import http from "node:http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";
import { createApp } from "./app.js";
import { attachSocketServer } from "./realtime/socket.js";

const app = createApp();
const server = http.createServer(app);
attachSocketServer(server);

server.listen(env.PORT, () => {
  logger.info("Guardian Tracker API started", { port: env.PORT, environment: env.NODE_ENV });
});

const shutdown = async (signal: string) => {
  logger.info("Shutting down API", { signal });
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
