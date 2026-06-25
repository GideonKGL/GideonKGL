import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthenticatedUser } from "../types.js";

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

const sign = (payload: AuthenticatedUser, secret: string, expiresIn: string) =>
  jwt.sign(payload, secret, { expiresIn } as SignOptions);

export const signTokenPair = (user: AuthenticatedUser): TokenPair => ({
  accessToken: sign(user, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN),
  refreshToken: sign(user, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN)
});

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthenticatedUser;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthenticatedUser;

export const randomToken = () => crypto.randomBytes(32).toString("hex");

export const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");
