import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate } from "../../middleware/auth.js";
import { HttpError } from "../../middleware/error.js";
import { requireRoles } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { audit } from "../audit/audit.service.js";
import { emitDevice, emitOperations } from "../../realtime/events.js";
import { asyncHandler } from "../../utils/async-handler.js";
import type { AuthenticatedRequest } from "../../types.js";

export const locationsRouter = Router();

const locationSchema = z.object({
  body: z.object({
    deviceId: z.string().uuid(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().nonnegative().optional(),
    speed: z.number().nonnegative().optional(),
    heading: z.number().min(0).max(360).optional(),
    altitude: z.number().optional(),
    battery: z.number().int().min(0).max(100).optional(),
    recordedAt: z.coerce.date().optional()
  })
});

const historySchema = z.object({
  query: z.object({
    deviceId: z.string().uuid(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
  })
});

locationsRouter.use(authenticate);

locationsRouter.post(
  "/",
  validate(locationSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const device = await prisma.device.findUnique({ where: { id: req.body.deviceId } });
    if (!device) {
      throw new HttpError(404, "Device not found", "DEVICE_NOT_FOUND");
    }

    const isOperations = req.user!.roles.some((role) => ["SUPER_ADMIN", "ADMIN", "DISPATCHER"].includes(role));
    if (!isOperations && device.userId !== req.user!.id) {
      throw new HttpError(403, "Cannot create locations for this device", "FORBIDDEN");
    }

    const location = await prisma.location.create({
      data: {
        deviceId: req.body.deviceId,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        accuracy: req.body.accuracy,
        speed: req.body.speed,
        heading: req.body.heading,
        altitude: req.body.altitude,
        battery: req.body.battery,
        recordedAt: req.body.recordedAt ?? new Date()
      }
    });

    await prisma.device.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } });
    emitDevice(device.id, "location.created", location);
    emitOperations("location.created", location);
    res.status(201).json(location);
  })
);

locationsRouter.get(
  "/live",
  requireRoles("ADMIN", "DISPATCHER", "RESPONDER"),
  asyncHandler(async (_req, res) => {
    const devices = await prisma.device.findMany({
      where: { isActive: true },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        locations: { orderBy: { recordedAt: "desc" }, take: 1 }
      },
      orderBy: { lastSeenAt: "desc" }
    });
    res.json(devices.filter((device) => device.locations.length > 0));
  })
);

locationsRouter.get(
  "/history",
  validate(historySchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const device = await prisma.device.findUnique({ where: { id: String(req.query.deviceId) } });
    if (!device) {
      throw new HttpError(404, "Device not found", "DEVICE_NOT_FOUND");
    }

    const isOperations = req.user!.roles.some((role) => ["SUPER_ADMIN", "ADMIN", "DISPATCHER", "RESPONDER"].includes(role));
    if (!isOperations && device.userId !== req.user!.id) {
      throw new HttpError(403, "Cannot read location history for this device", "FORBIDDEN");
    }

    const locations = await prisma.location.findMany({
      where: {
        deviceId: String(req.query.deviceId),
        recordedAt: {
          gte: req.query.from as Date | undefined,
          lte: req.query.to as Date | undefined
        }
      },
      orderBy: { recordedAt: "desc" },
      take: 1000
    });

    await audit({
      actorId: req.user!.id,
      action: "locations.history.read",
      entity: "devices",
      entityId: device.id
    });

    res.json(locations);
  })
);
