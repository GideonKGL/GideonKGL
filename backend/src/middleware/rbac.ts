import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../types.js";
import { HttpError } from "./error.js";

export const requireRoles =
  (...allowedRoles: string[]) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const roles = req.user?.roles ?? [];
    const authorized = roles.includes("SUPER_ADMIN") || allowedRoles.some((role) => roles.includes(role));

    if (!authorized) {
      next(new HttpError(403, "Insufficient role privileges", "FORBIDDEN"));
      return;
    }

    next();
  };
