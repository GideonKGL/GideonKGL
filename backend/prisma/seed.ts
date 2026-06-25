import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSecret } from "../src/utils/password.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
});

const roles = [
  "SUPER_ADMIN",
  "ADMIN",
  "DISPATCHER",
  "RESPONDER",
  "USER"
];

const permissions = [
  "users:read",
  "users:write",
  "devices:read",
  "devices:write",
  "locations:read",
  "locations:write",
  "alerts:read",
  "alerts:write",
  "notifications:write",
  "reports:read",
  "audit:read"
];

async function main() {
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} role` }
    });
  }

  for (const key of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: key }
    });
  }

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: "SUPER_ADMIN" } });
  const admin = await prisma.user.upsert({
    where: { email: "admin@securitatemdefensionis.co.za" },
    update: {},
    create: {
      email: "admin@securitatemdefensionis.co.za",
      passwordHash: await hashSecret("ChangeThisPassword123!"),
      firstName: "Guardian",
      lastName: "Administrator",
      roles: { create: { roleId: superAdminRole.id } }
    }
  });

  console.info(`Seeded admin user ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
