import { z } from 'zod';

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParam = z.object({
  id: z.string().min(1),
});

export const jobIdParam = z.object({
  jobId: z.string().min(1),
});

export const conversationIdParam = z.object({
  conversationId: z.string().min(1),
});
