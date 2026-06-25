import type { RequestHandler } from "express";
import { asyncHandler } from "../../utils/async-handler";
import * as notificationService from "./notification.service";
import type { NotificationQuery } from "./notification.validation";

export const createNotification: RequestHandler = asyncHandler(async (req, res) => {
  const notification = await notificationService.createNotification(req.body);
  res.status(201).json({ success: true, data: notification });
});

export const listNotifications: RequestHandler = asyncHandler(async (req, res) => {
  const notifications = await notificationService.listNotifications(req.user!.id, req.query as unknown as NotificationQuery);
  res.json({ success: true, ...notifications });
});

export const markNotificationRead: RequestHandler = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationRead(req.user!, req.params.id as string);
  res.json({ success: true, data: notification });
});

export const markAllRead: RequestHandler = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user!.id);
  res.json({ success: true, data: result });
});
