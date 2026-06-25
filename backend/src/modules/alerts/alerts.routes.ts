import { Router } from "express";
import { AlertStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate } from "../../middleware/auth.js";
import { HttpError } from "../../middleware/error.js";
import { requireRoles } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { audit } from "../audit/audit.service.js";
import { notificationService } from "../notifications/notification.service.js";
import { emitOperations } from "../../realtime/events.js";
import { asyncHandler } from "../../utils/async-handler.js";
import type { AuthenticatedRequest } from "../../types.js";

export const alertsRouter = Router();

const sosSchema = z.object({
  body: z.object({
    deviceId: z.string().uuid(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    message: z.string().max(1000).optional()
  })
});

const statusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.enum(["ACKNOWLEDGED", "RESOLVED", "CANCELLED"]) })
});

alertsRouter.use(authenticate);

alertsRouter.post(
  "/sos",
  validate(sosSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const device = await prisma.device.findUnique({
      where: { id: req.body.deviceId },
      include: { user: true }
    });

    if (!device) {
      throw new HttpError(404, "Device not found", "DEVICE_NOT_FOUND");
    }

    if (device.userId !== req.user!.id && !req.user!.roles.includes("SUPER_ADMIN")) {
      throw new HttpError(403, "Cannot trigger SOS for this device", "FORBIDDEN");
    }

    const alert = await prisma.emergencyAlert.create({
      data: {
        userId: device.userId,
        deviceId: device.id,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        message: req.body.message
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        device: true
      }
    });

    await notificationService.create({
      userId: device.userId,
      type: "SOS",
      title: "SOS alert received",
      body: "Emergency response has been notified.",
      data: { alertId: alert.id }
    });

    await audit({
      actorId: req.user!.id,
      action: "alerts.sos.create",
      entity: "emergency_alerts",
      entityId: alert.id,
      metadata: { deviceId: device.id }
    });

    emitOperations("sos.created", alert);
    res.status(201).json(alert);
  })
);

alertsRouter.get(
  "/",
  requireRoles("ADMIN", "DISPATCHER", "RESPONDER"),
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === "string" ? (req.query.status as AlertStatus) : undefined;
    const alerts = await prisma.emergencyAlert.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        device: true
      },
      orderBy: { createdAt: "desc" },
      take: 250
    });
    res.json(alerts);
  })
);

alertsRouter.patch(
  "/:id/status",
  requireRoles("ADMIN", "DISPATCHER", "RESPONDER"),
  validate(statusSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const alertId = String(req.params.id);
    const status = req.body.status as AlertStatus;
    const alert = await prisma.emergencyAlert.update({
      where: { id: alertId },
      data: {
        status,
        acknowledgedBy: status === "ACKNOWLEDGED" ? req.user!.id : undefined,
        acknowledgedAt: status === "ACKNOWLEDGED" ? new Date() : undefined,
        resolvedAt: status === "RESOLVED" || status === "CANCELLED" ? new Date() : undefined
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        device: true
      }
    });

    await audit({
      actorId: req.user!.id,
      action: "alerts.status.update",
      entity: "emergency_alerts",
      entityId: alert.id,
      metadata: { status }
    });

    emitOperations("sos.updated", alert);
    res.json(alert);
  })
);
