import { randomUUID } from "node:crypto";
import path from "node:path";
import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { routes } from "./routes";

export const createApp = (): express.Express => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers["x-request-id"]?.toString() ?? randomUUID(),
      customProps: (req) => ({ requestId: req.id })
    })
  );
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: "draft-8",
      legacyHeaders: false
    })
  );

  app.use("/uploads", express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));
  app.use(env.API_PREFIX, routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
