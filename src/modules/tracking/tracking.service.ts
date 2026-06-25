import { DeviceStatus, Role } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { badRequest, forbidden, notFound } from "../../utils/app-error";
import { getPagination, paginatedResponse } from "../../utils/pagination";
import { emitToRole, emitToUser } from "../../sockets/socket.service";
import type { CreateLocationInput, LocationHistoryQuery } from "./tracking.validation";

const locationSelect = {
  id: true,
  userId: true,
  deviceId: true,
  latitude: true,
  longitude: true,
  accuracy: true,
  altitude: true,
  speed: true,
  heading: true,
  recordedAt: true,
  createdAt: true
} as const;

interface LocationEventPayload {
  userId: string;
}

const trackingPrivilegedRoles: Role[] = [Role.ADMIN, Role.DISPATCHER, Role.RESPONDER];

export const createLocation = async (userId: string, input: CreateLocationInput) => {
  const device = input.deviceId
    ? await prisma.device.findUnique({
        where: { deviceId: input.deviceId },
        select: { id: true, userId: true, status: true }
      })
    : undefined;

  if (input.deviceId && !device) {
    throw notFound("Device");
  }

  if (device?.userId !== undefined && device.userId !== userId) {
    throw forbidden("Device does not belong to the authenticated user");
  }

  if (device?.status === DeviceStatus.REVOKED) {
    throw badRequest("Cannot track location for a revoked device");
  }

  const location = await prisma.$transaction(async (tx) => {
    const created = await tx.gpsLocation.create({
      data: {
        userId,
        deviceId: device?.id,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy,
        altitude: input.altitude,
        speed: input.speed,
        heading: input.heading,
        recordedAt: input.recordedAt ?? new Date()
      },
      select: locationSelect
    });

    if (device) {
      await tx.device.update({
        where: { id: device.id },
        data: { lastSeenAt: new Date(), status: DeviceStatus.ACTIVE }
      });
    }

    return created;
  });

  emitLocationUpdate(location);
  return location;
};

export const getLatestLocation = async (requestingUser: { id: string; role: Role }, targetUserId: string) => {
  enforceTrackingAccess(requestingUser, targetUserId);

  const location = await prisma.gpsLocation.findFirst({
    where: { userId: targetUserId },
    orderBy: { recordedAt: "desc" },
    select: locationSelect
  });

  if (!location) {
    throw notFound("Location");
  }

  return location;
};

export const getLocationHistory = async (
  requestingUser: { id: string; role: Role },
  targetUserId: string,
  query: LocationHistoryQuery
) => {
  enforceTrackingAccess(requestingUser, targetUserId);
  const { skip, take } = getPagination(query);
  const where = {
    userId: targetUserId,
    recordedAt: {
      gte: query.from,
      lte: query.to
    }
  };

  const [data, total] = await prisma.$transaction([
    prisma.gpsLocation.findMany({
      where,
      skip,
      take,
      orderBy: { recordedAt: "desc" },
      select: locationSelect
    }),
    prisma.gpsLocation.count({ where })
  ]);

  return paginatedResponse(data, total, query);
};

const enforceTrackingAccess = (requestingUser: { id: string; role: Role }, targetUserId: string): void => {
  if (requestingUser.id !== targetUserId && !trackingPrivilegedRoles.includes(requestingUser.role)) {
    throw forbidden();
  }
};

const emitLocationUpdate = (location: LocationEventPayload): void => {
  emitToUser(location.userId, "location:updated", location);
  emitToRole(Role.DISPATCHER, "location:updated", location);
  emitToRole(Role.RESPONDER, "location:updated", location);
  emitToRole(Role.ADMIN, "location:updated", location);
};
