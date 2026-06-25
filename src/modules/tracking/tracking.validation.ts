import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createLocationSchema = z.object({
  deviceId: z.string().min(3).max(200).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
  altitude: z.number().optional(),
  speed: z.number().nonnegative().optional(),
  heading: z.number().min(0).max(360).optional(),
  recordedAt: z.coerce.date().optional()
});

export const locationHistoryQuerySchema = paginationQuerySchema.extend({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});

export const trackingUserParamsSchema = z.object({
  userId: z.string().min(1)
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type LocationHistoryQuery = z.infer<typeof locationHistoryQuerySchema>;
