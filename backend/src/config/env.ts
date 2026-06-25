import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  DESKTOP_ORIGIN: z.string().url().default("http://localhost:5174"),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional()
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");

  // Fail fast with a clear, actionable message instead of a raw ZodError dump.
  // DATABASE_URL is required here: a missing or malformed value is reported by
  // name so deployment misconfiguration (e.g. an unset Render connection
  // string) is obvious at startup.
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;

export const allowedOrigins = [env.WEB_ORIGIN, env.DESKTOP_ORIGIN];
