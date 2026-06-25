import { Router } from "express";
import { DevicePlatform } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate } from "../../middleware/auth.js";
import { HttpError } from "../../middleware/error.js";
import { requireRoles } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { audit } from "../audit/audit.service.js";
import { asyncHandler } from "../../utils/async-handler.js";
import type { AuthenticatedRequest } from "../../types.js";

export const devicesRouter = Router();

const registerDeviceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(160),
    platform: z.nativeEnum(DevicePlatform),
    deviceUid: z.string().min(4).max(180),
    fcmToken: z.string().optional()
  })
});

const updateDeviceSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(160).optional(),
    fcmToken: z.string().nullable().optional(),
    isActive: z.boolean().optional()
  })
});

devicesRouter.use(authenticate);

devicesRouter.post(
  "/",
  validate(registerDeviceSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const device = await prisma.device.upsert({
      where: { deviceUid: req.body.deviceUid },
      update: {
        userId: req.user!.id,
        name: req.body.name,
        platform: req.body.platform,
        fcmToken: req.body.fcmToken,
        isActive: true,
        lastSeenAt: new Date()
      },
      create: {
        userId: req.user!.id,
        name: req.body.name,
        platform: req.body.platform,
        deviceUid: req.body.deviceUid,
        fcmToken: req.body.fcmToken,
        lastSeenAt: new Date()
      }
    });

    await audit({ actorId: req.user!.id, action: "devices.register", entity: "devices", entityId: device.id });
    res.status(201).json(device);
  })
);

devicesRouter.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const isOperations = req.user!.roles.some((role) => ["SUPER_ADMIN", "ADMIN", "DISPATCHER"].includes(role));
    const devices = await prisma.device.findMany({
      where: isOperations ? undefined : { userId: req.user!.id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        locations: { orderBy: { recordedAt: "desc" }, take: 1 }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(devices);
  })
);

devicesRouter.get(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const deviceId = String(req.params.id);
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        locations: { orderBy: { recordedAt: "desc" }, take: 1 }
      }
    });

    if (!device) {
      throw new HttpError(404, "Device not found", "DEVICE_NOT_FOUND");
    }

    const isOperations = req.user!.roles.some((role) => ["SUPER_ADMIN", "ADMIN", "DISPATCHER"].includes(role));
    if (!isOperations && device.userId !== req.user!.id) {
      throw new HttpError(403, "Device is outside your account", "FORBIDDEN");
    }

    res.json(device);
  })
);

devicesRouter.patch(
  "/:id",
  requireRoles("ADMIN"),
  validate(updateDeviceSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const deviceId = String(req.params.id);
    const device = await prisma.device.update({
      where: { id: deviceId },
      data: req.body
    });
    await audit({
      actorId: req.user!.id,
      action: "devices.update",
      entity: "devices",
      entityId: device.id,
      metadata: req.body
    });
    res.json(device);
  })
);
