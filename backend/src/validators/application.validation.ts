import { z } from 'zod';
import { paginationQuery } from './common';

export const createApplicationSchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z.string().max(10000).optional().nullable(),
  resumeUrl: z.string().url().max(500).optional().nullable(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['APPLIED', 'REVIEWING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']),
});

export const applicationQuerySchema = paginationQuery.extend({
  status: z
    .enum(['APPLIED', 'REVIEWING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'])
    .optional(),
});
