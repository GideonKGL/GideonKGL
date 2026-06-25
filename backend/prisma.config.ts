import { defineConfig, env } from "prisma/config";

const defaultDatabaseUrl = "postgresql://guardian:guardian_password@localhost:5432/guardian_tracker?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: process.env.DATABASE_URL ? env("DATABASE_URL") : defaultDatabaseUrl
  }
});
