import type { NextFunction, Response } from "express";
import { prisma } from "../config/prisma.js";
import type { AuthenticatedRequest } from "../types.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { HttpError } from "./error.js";

export const authenticate = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(new HttpError(401, "Missing bearer token", "UNAUTHENTICATED"));
    return;
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { roles: { include: { role: true } } }
    });

    if (!user?.isActive) {
      throw new HttpError(401, "User is inactive or unavailable", "UNAUTHENTICATED");
    }

    req.user = {
      id: user.id,
      email: user.email,
      roles: user.roles.map((userRole) => userRole.role.name)
    };

    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Invalid bearer token", "UNAUTHENTICATED"));
  }
};
