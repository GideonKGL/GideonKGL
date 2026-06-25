import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRoles } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const reportsRouter = Router();

const summarySchema = z.object({
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
  })
});

reportsRouter.use(authenticate, requireRoles("ADMIN", "DISPATCHER"));

reportsRouter.get(
  "/summary",
  validate(summarySchema),
  asyncHandler(async (req, res) => {
    const from = req.query.from as Date | undefined;
    const to = req.query.to as Date | undefined;
    const createdAt = from || to ? { gte: from, lte: to } : undefined;

    const [users, activeDevices, locations, openAlerts, resolvedAlerts] = await Promise.all([
      prisma.user.count(),
      prisma.device.count({ where: { isActive: true } }),
      prisma.location.count({ where: { createdAt } }),
      prisma.emergencyAlert.count({ where: { status: "OPEN", createdAt } }),
      prisma.emergencyAlert.count({ where: { status: "RESOLVED", createdAt } })
    ]);

    res.json({
      users,
      activeDevices,
      locations,
      openAlerts,
      resolvedAlerts
    });
  })
);
