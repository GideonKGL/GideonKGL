import { DeviceStatus, Role } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { conflict, forbidden, notFound } from "../../utils/app-error";
import { emitToUser } from "../../sockets/socket.service";
import type { RegisterDeviceInput, UpdateDeviceInput } from "./device.validation";

const deviceSelect = {
  id: true,
  deviceId: true,
  name: true,
  platform: true,
  pushToken: true,
  status: true,
  lastSeenAt: true,
  createdAt: true,
  updatedAt: true
} as const;

export const registerDevice = async (userId: string, input: RegisterDeviceInput) => {
  const existing = await prisma.device.findUnique({
    where: { deviceId: input.deviceId },
    select: { id: true, userId: true }
  });

  if (existing && existing.userId !== userId) {
    throw conflict("This device is already registered to another user");
  }

  const device = await prisma.device.upsert({
    where: { deviceId: input.deviceId },
    create: {
      userId,
      deviceId: input.deviceId,
      name: input.name,
      platform: input.platform,
      pushToken: input.pushToken,
      status: DeviceStatus.ACTIVE,
      lastSeenAt: new Date()
    },
    update: {
      name: input.name,
      platform: input.platform,
      pushToken: input.pushToken,
      status: DeviceStatus.ACTIVE,
      lastSeenAt: new Date()
    },
    select: deviceSelect
  });

  emitToUser(userId, "device:registered", device);
  return device;
};

export const listDevices = async (userId: string) =>
  prisma.device.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: deviceSelect
  });

export const updateDevice = async (
  requestingUser: { id: string; role: Role },
  id: string,
  input: UpdateDeviceInput
) => {
  const device = await prisma.device.findUnique({
    where: { id },
    select: { id: true, userId: true }
  });

  if (!device) {
    throw notFound("Device");
  }

  if (device.userId !== requestingUser.id && requestingUser.role !== Role.ADMIN) {
    throw forbidden();
  }

  const updated = await prisma.device.update({
    where: { id },
    data: input,
    select: deviceSelect
  });

  emitToUser(device.userId, "device:updated", updated);
  return updated;
};

export const revokeDevice = async (requestingUser: { id: string; role: Role }, id: string) =>
  updateDevice(requestingUser, id, { status: DeviceStatus.REVOKED, pushToken: null });
