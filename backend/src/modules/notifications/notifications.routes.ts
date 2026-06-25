import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import type { AuthenticatedRequest } from "../../types.js";

export const notificationsRouter = Router();

const tokenSchema = z.object({
  body: z.object({
    deviceId: z.string().uuid(),
    fcmToken: z.string().min(20)
  })
});

notificationsRouter.use(authenticate);

notificationsRouter.post(
  "/register-token",
  validate(tokenSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    await prisma.device.update({
      where: { id: req.body.deviceId },
      data: { fcmToken: req.body.fcmToken }
    });
    res.status(204).send();
  })
);

notificationsRouter.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json(notifications);
  })
);

notificationsRouter.patch(
  "/:id/read",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const notificationId = String(req.params.id);
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() }
    });
    res.json(notification);
  })
);
