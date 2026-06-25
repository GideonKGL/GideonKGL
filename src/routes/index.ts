import { Router } from "express";
import { prisma } from "../database/prisma";
import { asyncHandler } from "../utils/async-handler";
import { authRoutes } from "../modules/auth/auth.routes";
import { deviceRoutes } from "../modules/devices/device.routes";
import { incidentRoutes } from "../modules/incidents/incident.routes";
import { notificationRoutes } from "../modules/notifications/notification.routes";
import { sosRoutes } from "../modules/sos/sos.routes";
import { trackingRoutes } from "../modules/tracking/tracking.routes";
import { uploadRoutes } from "../modules/uploads/upload.routes";
import { userRoutes } from "../modules/users/user.routes";

export const routes = Router();

routes.get(
  "/health",
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString()
      }
    });
  })
);

routes.use("/auth", authRoutes);
routes.use("/users", userRoutes);
routes.use("/devices", deviceRoutes);
routes.use("/tracking", trackingRoutes);
routes.use("/sos", sosRoutes);
routes.use("/incidents", incidentRoutes);
routes.use("/notifications", notificationRoutes);
routes.use("/uploads", uploadRoutes);
