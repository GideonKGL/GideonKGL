import { IncidentStatus, NotificationChannel, NotificationType, Prisma, Role } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { badRequest, forbidden, notFound } from "../../utils/app-error";
import { getPagination, paginatedResponse } from "../../utils/pagination";
import { emitToRole, emitToUser } from "../../sockets/socket.service";
import { createNotification, notifyRoles } from "../notifications/notification.service";
import type {
  AssignIncidentInput,
  CreateIncidentInput,
  IncidentQuery,
  UpdateIncidentInput,
  UpdateIncidentStatusInput
} from "./incident.validation";

const incidentSelect = {
  id: true,
  reporterId: true,
  assigneeId: true,
  sosAlertId: true,
  title: true,
  description: true,
  severity: true,
  status: true,
  latitude: true,
  longitude: true,
  metadata: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  reporter: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  },
  assignee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  }
} as const;

const adminDispatcherRoles: Role[] = [Role.ADMIN, Role.DISPATCHER];
const incidentPrivilegedRoles: Role[] = [Role.ADMIN, Role.DISPATCHER, Role.RESPONDER];
const terminalIncidentStatuses: IncidentStatus[] = [IncidentStatus.RESOLVED, IncidentStatus.CLOSED];

export const createIncident = async (reporterId: string, input: CreateIncidentInput) => {
  const incident = await prisma.incident.create({
    data: {
      reporterId,
      title: input.title,
      description: input.description,
      severity: input.severity,
      latitude: input.latitude,
      longitude: input.longitude,
      metadata: input.metadata as Prisma.InputJsonValue | undefined
    },
    select: incidentSelect
  });

  emitIncidentEvent("incident:created", incident);
  await notifyRoles([Role.ADMIN, Role.DISPATCHER, Role.RESPONDER], {
    title: "New incident reported",
    body: incident.title,
    type: NotificationType.INCIDENT,
    channel: NotificationChannel.IN_APP,
    data: { incidentId: incident.id, severity: incident.severity }
  });

  return incident;
};

export const listIncidents = async (requestingUser: { id: string; role: Role }, query: IncidentQuery) => {
  const privileged = isIncidentPrivileged(requestingUser.role);
  const { skip, take } = getPagination(query);
  const where = privileged
    ? {
        status: query.status,
        severity: query.severity,
        reporterId: query.reporterId,
        assigneeId: query.assigneeId
      }
    : {
        status: query.status,
        severity: query.severity,
        OR: [{ reporterId: requestingUser.id }, { assigneeId: requestingUser.id }]
      };

  const [data, total] = await prisma.$transaction([
    prisma.incident.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: incidentSelect
    }),
    prisma.incident.count({ where })
  ]);

  return paginatedResponse(data, total, query);
};

export const getIncident = async (requestingUser: { id: string; role: Role }, id: string) => {
  const incident = await prisma.incident.findUnique({
    where: { id },
    select: incidentSelect
  });

  if (!incident) {
    throw notFound("Incident");
  }

  enforceIncidentAccess(requestingUser, incident);
  return incident;
};

export const updateIncident = async (
  requestingUser: { id: string; role: Role },
  id: string,
  input: UpdateIncidentInput
) => {
  const incident = await prisma.incident.findUnique({
    where: { id },
    select: { id: true, reporterId: true, assigneeId: true, status: true }
  });

  if (!incident) {
    throw notFound("Incident");
  }

  if (incident.reporterId !== requestingUser.id && !adminDispatcherRoles.includes(requestingUser.role)) {
    throw forbidden();
  }

  if (terminalIncidentStatuses.includes(incident.status)) {
    throw badRequest("Resolved or closed incidents cannot be edited");
  }

  const updated = await prisma.incident.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      severity: input.severity,
      latitude: input.latitude,
      longitude: input.longitude,
      metadata: input.metadata as Prisma.InputJsonValue | undefined
    },
    select: incidentSelect
  });

  emitIncidentEvent("incident:updated", updated);
  return updated;
};

export const assignIncident = async (
  requestingUser: { id: string; role: Role },
  id: string,
  input: AssignIncidentInput
) => {
  if (!adminDispatcherRoles.includes(requestingUser.role)) {
    throw forbidden();
  }

  const assignee = await prisma.user.findUnique({
    where: { id: input.assigneeId },
    select: { id: true, role: true, isActive: true }
  });

  if (!assignee?.isActive || !incidentPrivilegedRoles.includes(assignee.role)) {
    throw badRequest("Assignee must be an active responder, dispatcher, or admin");
  }

  const updated = await prisma.incident.update({
    where: { id },
    data: {
      assigneeId: input.assigneeId,
      status: IncidentStatus.ASSIGNED
    },
    select: incidentSelect
  });

  await createNotification({
    userId: input.assigneeId,
    title: "Incident assigned",
    body: updated.title,
    type: NotificationType.INCIDENT,
    channel: NotificationChannel.IN_APP,
    data: { incidentId: updated.id }
  });
  emitIncidentEvent("incident:assigned", updated);
  return updated;
};

export const updateIncidentStatus = async (
  requestingUser: { id: string; role: Role },
  id: string,
  input: UpdateIncidentStatusInput
) => {
  const incident = await prisma.incident.findUnique({
    where: { id },
    select: { id: true, reporterId: true, assigneeId: true }
  });

  if (!incident) {
    throw notFound("Incident");
  }

  if (!isIncidentPrivileged(requestingUser.role) && incident.assigneeId !== requestingUser.id) {
    throw forbidden();
  }

  const updated = await prisma.incident.update({
    where: { id },
    data: {
      status: input.status,
      resolvedAt: terminalIncidentStatuses.includes(input.status) ? new Date() : null
    },
    select: incidentSelect
  });

  emitIncidentEvent("incident:status_changed", updated);
  emitToUser(updated.reporterId, "incident:status_changed", updated);
  if (updated.assigneeId) {
    emitToUser(updated.assigneeId, "incident:status_changed", updated);
  }

  return updated;
};

const isIncidentPrivileged = (role: Role): boolean => incidentPrivilegedRoles.includes(role);

const enforceIncidentAccess = (
  requestingUser: { id: string; role: Role },
  incident: { reporterId: string; assigneeId: string | null }
): void => {
  if (
    incident.reporterId !== requestingUser.id &&
    incident.assigneeId !== requestingUser.id &&
    !isIncidentPrivileged(requestingUser.role)
  ) {
    throw forbidden();
  }
};

const emitIncidentEvent = (event: string, payload: { reporterId: string; assigneeId: string | null }): void => {
  emitToUser(payload.reporterId, event, payload);
  if (payload.assigneeId) {
    emitToUser(payload.assigneeId, event, payload);
  }
  emitToRole(Role.ADMIN, event, payload);
  emitToRole(Role.DISPATCHER, event, payload);
  emitToRole(Role.RESPONDER, event, payload);
};
