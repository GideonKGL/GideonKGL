import { DevicePlatform, DeviceStatus } from "@prisma/client";
import { z } from "zod";

export const registerDeviceSchema = z.object({
  deviceId: z.string().min(3).max(200),
  name: z.string().max(120).optional(),
  platform: z.enum(DevicePlatform),
  pushToken: z.string().max(500).optional()
});

export const updateDeviceSchema = z.object({
  name: z.string().max(120).optional(),
  pushToken: z.string().max(500).nullable().optional(),
  status: z.enum(DeviceStatus).optional()
});

export const deviceParamsSchema = z.object({
  id: z.string().min(1)
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
