import { Router } from "express";
import { checkDatabaseConnection } from "../../config/database.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const healthRouter = Router();

healthRouter.get(
  "/db",
  asyncHandler(async (_req, res) => {
    const health = await checkDatabaseConnection();
    res.status(health.status === "connected" ? 200 : 503).json({
      service: "database",
      status: health.status,
      responseTimeMs: health.responseTimeMs,
      ...(health.error ? { error: health.error } : {}),
      timestamp: new Date().toISOString()
    });
  })
);
