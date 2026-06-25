import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { firebaseAuth } from "../../config/firebase";
import { prisma } from "../../database/prisma";
import { AppError, conflict, unauthorized } from "../../utils/app-error";
import { signAccessToken } from "../../utils/jwt";
import type {
  FirebaseLoginInput,
  LoginInput,
  PinLoginInput,
  RegisterInput,
  SetupPinInput
} from "./auth.validation";

const HASH_ROUNDS = 12;

interface UserSummary {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  firebaseUid: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const toAuthResponse = (user: UserSummary) => ({
  user,
  accessToken: signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    firebaseUid: user.firebaseUid
  })
});

export const register = async (input: RegisterInput) => {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.email }, ...(input.phone ? [{ phone: input.phone }] : [])]
    },
    select: { id: true }
  });

  if (existing) {
    throw conflict("A user with this email or phone already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, HASH_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      phone: input.phone,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: Role.USER
    },
    select: userSummarySelect
  });

  return toAuthResponse(user);
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...userSummarySelect, passwordHash: true }
  });

  if (!user?.passwordHash || !user.isActive) {
    throw unauthorized("Invalid credentials");
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!validPassword) {
    throw unauthorized("Invalid credentials");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
    select: userSummarySelect
  });

  return toAuthResponse(updated);
};

export const setupPin = async (userId: string, input: SetupPinInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, isActive: true }
  });

  if (!user?.isActive) {
    throw unauthorized("User account is inactive or no longer exists");
  }

  if (user.passwordHash) {
    if (!input.currentPassword) {
      throw unauthorized("Current password is required to set a PIN");
    }

    const validPassword = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!validPassword) {
      throw unauthorized("Invalid current password");
    }
  }

  const pinHash = await bcrypt.hash(input.pin, HASH_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { pinHash }
  });

  return { message: "PIN configured successfully" };
};

export const loginWithPin = async (input: PinLoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...userSummarySelect, pinHash: true }
  });

  if (!user?.pinHash || !user.isActive) {
    throw unauthorized("Invalid credentials");
  }

  const validPin = await bcrypt.compare(input.pin, user.pinHash);
  if (!validPin) {
    throw unauthorized("Invalid credentials");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
    select: userSummarySelect
  });

  return toAuthResponse(updated);
};

export const loginWithFirebase = async (input: FirebaseLoginInput) => {
  if (!firebaseAuth) {
    throw new AppError(503, "Firebase authentication is not configured", "FIREBASE_NOT_CONFIGURED");
  }

  const decoded = await firebaseAuth.verifyIdToken(input.idToken);
  const email = decoded.email?.toLowerCase();

  if (!email) {
    throw unauthorized("Firebase token must contain a verified email");
  }

  const displayNameParts = (decoded.name ?? "").trim().split(/\s+/).filter(Boolean);
  const firstName = input.firstName ?? displayNameParts[0] ?? "Firebase";
  const lastName = input.lastName ?? displayNameParts.slice(1).join(" ") ?? "User";

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      firebaseUid: decoded.uid,
      phone: input.phone,
      firstName,
      lastName,
      lastLoginAt: new Date()
    },
    create: {
      email,
      phone: input.phone,
      firebaseUid: decoded.uid,
      firstName,
      lastName,
      role: Role.USER,
      lastLoginAt: new Date()
    },
    select: userSummarySelect
  });

  if (!user.isActive) {
    throw unauthorized("User account is inactive");
  }

  return toAuthResponse(user);
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSummarySelect
  });

  if (!user?.isActive) {
    throw unauthorized("User account is inactive or no longer exists");
  }

  return user;
};

const userSummarySelect = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  role: true,
  firebaseUid: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
} as const;
