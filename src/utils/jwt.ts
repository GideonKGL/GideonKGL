import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env";
import { unauthorized } from "./app-error";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  firebaseUid?: string | null;
}

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: "safety-response-backend"
  });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: "safety-response-backend"
    });

    if (typeof decoded === "string" || !decoded.sub || !decoded.email || !decoded.role) {
      throw unauthorized("Invalid access token");
    }

    return {
      sub: decoded.sub,
      email: decoded.email as string,
      role: decoded.role as Role,
      firebaseUid: decoded.firebaseUid as string | null | undefined
    };
  } catch {
    throw unauthorized("Invalid or expired access token");
  }
};
