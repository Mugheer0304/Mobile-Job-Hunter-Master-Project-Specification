import { z } from 'zod';
import { paginationQuery } from './common';

export const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  imageUrl: z.string().url().max(500).optional().nullable(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const postQuerySchema = paginationQuery.extend({
  authorId: z.string().optional(),
});
