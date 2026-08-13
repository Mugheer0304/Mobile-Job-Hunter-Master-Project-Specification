import { z } from 'zod';
import { paginationQuery } from './common';

export const notificationQuerySchema = paginationQuery.extend({
  unreadOnly: z.enum(['true', 'false']).optional(),
});

export const markReadSchema = z.object({
  ids: z.array(z.string().min(1)).optional(),
  all: z.boolean().default(false),
});
