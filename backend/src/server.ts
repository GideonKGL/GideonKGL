import http from "node:http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { createApp } from "./app.js";
import { attachSocketServer } from "./realtime/socket.js";

const startServer = async () => {
  logger.info("Starting Guardian Tracker API", { environment: env.NODE_ENV });

  // Fail fast: confirm the database is reachable before binding the HTTP server.
  // If this rejects, the process exits below and Express never starts listening.
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);
  attachSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(env.PORT, () => {
      logger.info("Guardian Tracker API started", { port: env.PORT, environment: env.NODE_ENV });
      resolve();
    });
  });

  const shutdown = (signal: string) => {
    logger.info("Shutting down API", { signal });
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch(async (error) => {
  logger.error("Fatal startup error: API did not start", {
    error: error instanceof Error ? error.message : String(error)
  });
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
