import http from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDatabase, disconnectDatabase } from "./database/prisma";
import { configureSocketServer } from "./sockets/socket.server";

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);
  configureSocketServer(server);

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, apiPrefix: env.API_PREFIX }, "HTTP server started");
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info({ signal }, "Shutting down server");
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

void startServer().catch((error) => {
  logger.fatal({ error }, "Failed to start server");
  process.exit(1);
});
