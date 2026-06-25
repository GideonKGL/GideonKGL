import { Role } from "@prisma/client";
import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const userQuerySchema = paginationQuerySchema.extend({
  role: z.enum(Role).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().min(1).max(100).optional()
});

export const userParamsSchema = z.object({
  id: z.string().min(1)
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().min(7).max(30).nullable().optional()
});

export const updateUserAccessSchema = z.object({
  role: z.enum(Role).optional(),
  isActive: z.boolean().optional()
});

export type UserQuery = z.infer<typeof userQuerySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUserAccessInput = z.infer<typeof updateUserAccessSchema>;
