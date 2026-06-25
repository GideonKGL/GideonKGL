import type { RequestHandler } from "express";
import { prisma } from "../database/prisma";
import { unauthorized } from "../utils/app-error";
import { verifyAccessToken } from "../utils/jwt";

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw unauthorized();
    }

    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        firebaseUid: true,
        isActive: true
      }
    });

    if (!user?.isActive) {
      throw unauthorized("User account is inactive or no longer exists");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firebaseUid: user.firebaseUid
    };

    next();
  } catch (error) {
    next(error);
  }
};
