import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { forbidden, notFound } from "../../utils/app-error";
import { getPagination, paginatedResponse } from "../../utils/pagination";
import { emitToUser } from "../../sockets/socket.service";
import type { CreateNotificationInput, NotificationQuery } from "./notification.validation";

const notificationSelect = {
  id: true,
  userId: true,
  title: true,
  body: true,
  type: true,
  channel: true,
  data: true,
  readAt: true,
  createdAt: true
} as const;

export const createNotification = async (input: CreateNotificationInput) => {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
      channel: input.channel,
      data: input.data as Prisma.InputJsonValue | undefined
    },
    select: notificationSelect
  });

  emitToUser(input.userId, "notification:new", notification);
  return notification;
};

export const notifyRoles = async (
  roles: Role[],
  payload: Omit<CreateNotificationInput, "userId">
): Promise<void> => {
  const users = await prisma.user.findMany({
    where: { role: { in: roles }, isActive: true },
    select: { id: true }
  });

  await Promise.all(
    users.map((user) =>
      createNotification({
        userId: user.id,
        ...payload
      })
    )
  );
};

export const listNotifications = async (userId: string, query: NotificationQuery) => {
  const { skip, take } = getPagination(query);
  const where = {
    userId,
    readAt: query.unreadOnly ? null : undefined
  };

  const [data, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: notificationSelect
    }),
    prisma.notification.count({ where })
  ]);

  return paginatedResponse(data, total, query);
};

export const markNotificationRead = async (requestingUser: { id: string; role: Role }, id: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id },
    select: { id: true, userId: true }
  });

  if (!notification) {
    throw notFound("Notification");
  }

  if (notification.userId !== requestingUser.id && requestingUser.role !== Role.ADMIN) {
    throw forbidden();
  }

  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
    select: notificationSelect
  });
};

export const markAllRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() }
  });

  return { updated: result.count };
};
