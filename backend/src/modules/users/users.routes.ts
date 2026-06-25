import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate } from "../../middleware/auth.js";
import { HttpError } from "../../middleware/error.js";
import { requireRoles } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { audit } from "../audit/audit.service.js";
import { asyncHandler } from "../../utils/async-handler.js";
import type { AuthenticatedRequest } from "../../types.js";

export const usersRouter = Router();

const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  roles: { include: { role: true } }
};

const updateMeSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(120).optional(),
    lastName: z.string().min(1).max(120).optional(),
    phone: z.string().max(40).nullable().optional(),
    avatarUrl: z.string().url().nullable().optional()
  })
});

const roleAssignmentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ roles: z.array(z.string().min(1)).min(1) })
});

usersRouter.use(authenticate);

usersRouter.get(
  "/me",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: publicUserSelect });
    res.json(user);
  })
);

usersRouter.patch(
  "/me",
  validate(updateMeSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: req.body,
      select: publicUserSelect
    });
    await audit({ actorId: req.user!.id, action: "users.profile.update", entity: "users", entityId: user.id });
    res.json(user);
  })
);

usersRouter.get(
  "/",
  requireRoles("ADMIN", "DISPATCHER"),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: publicUserSelect
    });
    res.json(users);
  })
);

usersRouter.patch(
  "/:id/roles",
  requireRoles("ADMIN"),
  validate(roleAssignmentSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const roles = await prisma.role.findMany({ where: { name: { in: req.body.roles } } });
    if (roles.length !== req.body.roles.length) {
      throw new HttpError(400, "One or more roles are invalid", "INVALID_ROLES");
    }

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: req.params.id } }),
      prisma.userRole.createMany({
        data: roles.map((role) => ({ userId: req.params.id, roleId: role.id })),
        skipDuplicates: true
      })
    ]);

    await audit({
      actorId: req.user!.id,
      action: "users.roles.update",
      entity: "users",
      entityId: req.params.id,
      metadata: { roles: req.body.roles }
    });

    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: publicUserSelect });
    res.json(user);
  })
);
