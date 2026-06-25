import {
  AlertStatus,
  IncidentSeverity,
  IncidentStatus,
  NotificationChannel,
  NotificationType,
  Prisma,
  Role
} from "@prisma/client";
import { prisma } from "../../database/prisma";
import { badRequest, forbidden, notFound } from "../../utils/app-error";
import { getPagination, paginatedResponse } from "../../utils/pagination";
import { emitToRole, emitToUser } from "../../sockets/socket.service";
import { notifyRoles } from "../notifications/notification.service";
import type { CreateSosAlertInput, SosAlertQuery } from "./sos.validation";

const sosAlertSelect = {
  id: true,
  userId: true,
  deviceId: true,
  status: true,
  latitude: true,
  longitude: true,
  message: true,
  metadata: true,
  acknowledgedById: true,
  acknowledgedAt: true,
  resolvedById: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  incident: {
    select: {
      id: true,
      title: true,
      severity: true,
      status: true
    }
  }
} as const;

const responderRoles: Role[] = [Role.ADMIN, Role.DISPATCHER, Role.RESPONDER];
const actionableAlertStatuses: AlertStatus[] = [AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED];

export const createSosAlert = async (userId: string, input: CreateSosAlertInput) => {
  const device = input.deviceId
    ? await prisma.device.findUnique({
        where: { deviceId: input.deviceId },
        select: { id: true, userId: true }
      })
    : undefined;

  if (input.deviceId && !device) {
    throw notFound("Device");
  }

  if (device?.userId !== undefined && device.userId !== userId) {
    throw forbidden("Device does not belong to the authenticated user");
  }

  const alert = await prisma.$transaction(async (tx) => {
    const createdAlert = await tx.sosAlert.create({
      data: {
        userId,
        deviceId: device?.id,
        latitude: input.latitude,
        longitude: input.longitude,
        message: input.message,
        metadata: input.metadata as Prisma.InputJsonValue | undefined
      },
      select: { id: true }
    });

    await tx.incident.create({
      data: {
        reporterId: userId,
        sosAlertId: createdAlert.id,
        title: "SOS Alert",
        description: input.message,
        severity: IncidentSeverity.CRITICAL,
        latitude: input.latitude,
        longitude: input.longitude,
        metadata: input.metadata as Prisma.InputJsonValue | undefined
      }
    });

    return tx.sosAlert.findUniqueOrThrow({
      where: { id: createdAlert.id },
      select: sosAlertSelect
    });
  });

  emitSosEvent("sos:created", alert);
  await notifyRoles([Role.ADMIN, Role.DISPATCHER, Role.RESPONDER], {
    title: "New SOS alert",
    body: input.message ?? "A user triggered an SOS alert.",
    type: NotificationType.SOS,
    channel: NotificationChannel.IN_APP,
    data: { alertId: alert.id, userId, latitude: input.latitude, longitude: input.longitude }
  });

  return alert;
};

export const listSosAlerts = async (requestingUser: { id: string; role: Role }, query: SosAlertQuery) => {
  const privileged = isResponderRole(requestingUser.role);
  const userId = privileged ? query.userId : requestingUser.id;
  const { skip, take } = getPagination(query);
  const where = {
    userId,
    status: query.status
  };

  const [data, total] = await prisma.$transaction([
    prisma.sosAlert.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: sosAlertSelect
    }),
    prisma.sosAlert.count({ where })
  ]);

  return paginatedResponse(data, total, query);
};

export const getSosAlert = async (requestingUser: { id: string; role: Role }, id: string) => {
  const alert = await prisma.sosAlert.findUnique({
    where: { id },
    select: sosAlertSelect
  });

  if (!alert) {
    throw notFound("SOS alert");
  }

  if (alert.userId !== requestingUser.id && !isResponderRole(requestingUser.role)) {
    throw forbidden();
  }

  return alert;
};

export const acknowledgeSosAlert = async (requestingUser: { id: string; role: Role }, id: string) => {
  if (!isResponderRole(requestingUser.role)) {
    throw forbidden();
  }

  const alert = await prisma.sosAlert.findUnique({
    where: { id },
    select: { id: true, status: true, userId: true }
  });

  if (!alert) {
    throw notFound("SOS alert");
  }

  if (alert.status !== AlertStatus.ACTIVE) {
    throw badRequest("Only active SOS alerts can be acknowledged");
  }

  const updated = await prisma.sosAlert.update({
    where: { id },
    data: {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedById: requestingUser.id,
      acknowledgedAt: new Date()
    },
    select: sosAlertSelect
  });

  emitSosEvent("sos:acknowledged", updated);
  emitToUser(alert.userId, "sos:acknowledged", updated);
  return updated;
};

export const resolveSosAlert = async (
  requestingUser: { id: string; role: Role },
  id: string,
  resolutionNote?: string
) => {
  if (!isResponderRole(requestingUser.role)) {
    throw forbidden();
  }

  const alert = await prisma.sosAlert.findUnique({
    where: { id },
    select: { id: true, status: true, userId: true }
  });

  if (!alert) {
    throw notFound("SOS alert");
  }

  if (!actionableAlertStatuses.includes(alert.status)) {
    throw badRequest("Only active or acknowledged SOS alerts can be resolved");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const resolved = await tx.sosAlert.update({
      where: { id },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedById: requestingUser.id,
        resolvedAt: new Date(),
        metadata: resolutionNote ? { resolutionNote } : undefined
      },
      select: sosAlertSelect
    });

    if (resolved.incident) {
      await tx.incident.update({
        where: { id: resolved.incident.id },
        data: { status: IncidentStatus.RESOLVED, resolvedAt: new Date() }
      });
    }

    return resolved;
  });

  emitSosEvent("sos:resolved", updated);
  emitToUser(alert.userId, "sos:resolved", updated);
  return updated;
};

export const cancelSosAlert = async (requestingUser: { id: string; role: Role }, id: string) => {
  const alert = await prisma.sosAlert.findUnique({
    where: { id },
    select: { id: true, status: true, userId: true }
  });

  if (!alert) {
    throw notFound("SOS alert");
  }

  if (alert.userId !== requestingUser.id && requestingUser.role !== Role.ADMIN) {
    throw forbidden();
  }

  if (!actionableAlertStatuses.includes(alert.status)) {
    throw badRequest("Only active or acknowledged SOS alerts can be cancelled");
  }

  const updated = await prisma.sosAlert.update({
    where: { id },
    data: { status: AlertStatus.CANCELLED },
    select: sosAlertSelect
  });

  emitSosEvent("sos:cancelled", updated);
  return updated;
};

const isResponderRole = (role: Role): boolean => responderRoles.includes(role);

const emitSosEvent = (event: string, payload: { userId: string }): void => {
  emitToUser(payload.userId, event, payload);
  emitToRole(Role.ADMIN, event, payload);
  emitToRole(Role.DISPATCHER, event, payload);
  emitToRole(Role.RESPONDER, event, payload);
};
