import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default("/api/v1"),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  CORS_ORIGIN: z.string().default("*"),
  LOG_LEVEL: z.string().default("info"),
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(20),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_BASE64: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid environment configuration:\n${details.join("\n")}`);
}

const rawCorsOrigins = parsed.data.CORS_ORIGIN.trim();

export const env = {
  ...parsed.data,
  CORS_ORIGINS:
    rawCorsOrigins === "*"
      ? "*"
      : rawCorsOrigins
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
  MAX_FILE_SIZE_BYTES: parsed.data.MAX_FILE_SIZE_MB * 1024 * 1024
};

export type Env = typeof env;
