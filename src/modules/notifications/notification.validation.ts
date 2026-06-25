import { NotificationChannel, NotificationType } from "@prisma/client";
import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const notificationQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z.coerce.boolean().default(false)
});

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(1000),
  type: z.enum(NotificationType).default(NotificationType.SYSTEM),
  channel: z.enum(NotificationChannel).default(NotificationChannel.IN_APP),
  data: z.record(z.string(), z.unknown()).optional()
});

export const notificationParamsSchema = z.object({
  id: z.string().min(1)
});

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
