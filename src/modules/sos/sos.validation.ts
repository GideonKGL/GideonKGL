import { AlertStatus } from "@prisma/client";
import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createSosAlertSchema = z.object({
  deviceId: z.string().min(3).max(200).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  message: z.string().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const sosAlertQuerySchema = paginationQuerySchema.extend({
  status: z.enum(AlertStatus).optional(),
  userId: z.string().min(1).optional()
});

export const sosAlertParamsSchema = z.object({
  id: z.string().min(1)
});

export const resolveSosAlertSchema = z.object({
  resolutionNote: z.string().max(1000).optional()
});

export type CreateSosAlertInput = z.infer<typeof createSosAlertSchema>;
export type SosAlertQuery = z.infer<typeof sosAlertQuerySchema>;
