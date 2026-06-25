import { IncidentSeverity, IncidentStatus } from "@prisma/client";
import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createIncidentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  severity: z.enum(IncidentSeverity).default(IncidentSeverity.MEDIUM),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const incidentQuerySchema = paginationQuerySchema.extend({
  status: z.enum(IncidentStatus).optional(),
  severity: z.enum(IncidentSeverity).optional(),
  reporterId: z.string().min(1).optional(),
  assigneeId: z.string().min(1).optional()
});

export const updateIncidentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  severity: z.enum(IncidentSeverity).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const assignIncidentSchema = z.object({
  assigneeId: z.string().min(1)
});

export const updateIncidentStatusSchema = z.object({
  status: z.enum(IncidentStatus)
});

export const incidentParamsSchema = z.object({
  id: z.string().min(1)
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type IncidentQuery = z.infer<typeof incidentQuerySchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
export type AssignIncidentInput = z.infer<typeof assignIncidentSchema>;
export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>;
