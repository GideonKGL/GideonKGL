import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export interface PaginationInput {
  page: number;
  limit: number;
}

export const getPagination = ({ page, limit }: PaginationInput): { skip: number; take: number } => ({
  skip: (page - 1) * limit,
  take: limit
});

export const paginatedResponse = <T>(data: T[], total: number, input: PaginationInput) => ({
  data,
  pagination: {
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.ceil(total / input.limit)
  }
});
