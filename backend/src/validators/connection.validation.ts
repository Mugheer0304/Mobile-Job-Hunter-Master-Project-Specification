import { z } from 'zod';
import { paginationQuery } from './common';

export const connectionRequestSchema = z.object({
  addresseeId: z.string().min(1),
});

export const connectionRespondSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

export const connectionQuerySchema = paginationQuery.extend({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']).optional(),
});
