import { z } from 'zod';
import { paginationQuery } from './common';

export const createConversationSchema = z.object({
  userId: z.string().min(1),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(5000),
});

export const messageQuerySchema = paginationQuery;
