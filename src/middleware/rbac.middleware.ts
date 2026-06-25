import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";
import { forbidden, unauthorized } from "../utils/app-error";

export const requireRoles =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      return next(unauthorized());
    }

    if (!roles.includes(req.user.role)) {
      return next(forbidden());
    }

    return next();
  };

export const requireSelfOrRoles =
  (getOwnerId: (req: Parameters<RequestHandler>[0]) => string | undefined, ...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      return next(unauthorized());
    }

    const ownerId = getOwnerId(req);
    if (ownerId === req.user.id || roles.includes(req.user.role)) {
      return next();
    }

    return next(forbidden());
  };
