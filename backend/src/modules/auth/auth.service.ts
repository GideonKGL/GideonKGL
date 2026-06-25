import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../middleware/error.js";
import { audit } from "../audit/audit.service.js";
import { hashSecret, verifySecret } from "../../utils/password.js";
import { randomToken, sha256, signTokenPair, verifyRefreshToken } from "../../utils/tokens.js";

const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  isActive: true,
  lastLoginAt: true,
  roles: { include: { role: true } }
};

const toSessionUser = (user: { id: string; email: string; roles: { role: { name: string } }[] }) => ({
  id: user.id,
  email: user.email,
  roles: user.roles.map((userRole) => userRole.role.name)
});

export const authService = {
  register: async (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    ipAddress?: string;
    userAgent?: string;
  }) => {
    const passwordHash = await hashSecret(input.password);
    const userRole = await prisma.role.findUnique({ where: { name: "USER" } });

    if (!userRole) {
      throw new HttpError(500, "Default USER role is not configured", "ROLE_CONFIGURATION_ERROR");
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        roles: { create: { roleId: userRole.id } }
      },
      select: publicUserSelect
    });

    await audit({
      actorId: user.id,
      action: "auth.register",
      entity: "users",
      entityId: user.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    });

    return { user, ...signTokenPair(toSessionUser(user)) };
  },

  login: async (email: string, password: string, metadata?: { ipAddress?: string; userAgent?: string }) => {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } }
    });

    if (!user || !user.isActive || !(await verifySecret(user.passwordHash, password))) {
      throw new HttpError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: publicUserSelect
    });

    await audit({
      actorId: user.id,
      action: "auth.login.password",
      entity: "users",
      entityId: user.id,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent
    });

    return { user: updated, ...signTokenPair(toSessionUser(user)) };
  },

  pinLogin: async (email: string, pin: string, metadata?: { ipAddress?: string; userAgent?: string }) => {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } }
    });

    if (!user?.pinHash || !user.isActive || !(await verifySecret(user.pinHash, pin))) {
      throw new HttpError(401, "Invalid email or PIN", "INVALID_PIN");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: publicUserSelect
    });

    await audit({
      actorId: user.id,
      action: "auth.login.pin",
      entity: "users",
      entityId: user.id,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent
    });

    return { user: updated, ...signTokenPair(toSessionUser(user)) };
  },

  setPin: async (userId: string, pin: string) => {
    await prisma.user.update({
      where: { id: userId },
      data: { pinHash: await hashSecret(pin) }
    });

    await audit({ actorId: userId, action: "auth.pin.set", entity: "users", entityId: userId });
  },

  refresh: async (refreshToken: string) => {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { roles: { include: { role: true } } }
    });

    if (!user?.isActive) {
      throw new HttpError(401, "Refresh token is not valid", "UNAUTHENTICATED");
    }

    return signTokenPair(toSessionUser(user));
  },

  requestPasswordReset: async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return;
    }

    const token = randomToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: sha256(token),
        passwordResetExpiry: new Date(Date.now() + 1000 * 60 * 30)
      }
    });

    await audit({
      actorId: user.id,
      action: "auth.password_reset.request",
      entity: "users",
      entityId: user.id
    });

    return token;
  },

  confirmPasswordReset: async (token: string, password: string) => {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: sha256(token),
        passwordResetExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      throw new HttpError(400, "Password reset token is invalid or expired", "INVALID_RESET_TOKEN");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashSecret(password),
        passwordResetToken: null,
        passwordResetExpiry: null
      }
    });

    await audit({
      actorId: user.id,
      action: "auth.password_reset.confirm",
      entity: "users",
      entityId: user.id
    });
  }
};
