import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as notificationController from "./notification.controller";
import {
  createNotificationSchema,
  notificationParamsSchema,
  notificationQuerySchema
} from "./notification.validation";

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);
notificationRoutes.get("/", validate({ query: notificationQuerySchema }), notificationController.listNotifications);
notificationRoutes.post(
  "/",
  requireRoles(Role.ADMIN, Role.DISPATCHER),
  validate({ body: createNotificationSchema }),
  notificationController.createNotification
);
notificationRoutes.patch(
  "/:id/read",
  validate({ params: notificationParamsSchema }),
  notificationController.markNotificationRead
);
notificationRoutes.patch("/read-all", notificationController.markAllRead);
