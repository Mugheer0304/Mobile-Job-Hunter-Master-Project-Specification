import { z } from 'zod';
import { paginationQuery } from './common';

export const createJobSchema = z.object({
  companyId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(20000),
  location: z.string().max(255).optional().nullable(),
  employmentType: z
    .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE'])
    .default('FULL_TIME'),
  experienceLevel: z.string().max(100).optional().nullable(),
  salaryMin: z.number().int().nonnegative().optional().nullable(),
  salaryMax: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().max(10).default('USD'),
  skills: z.array(z.string().max(100)).default([]),
  status: z.enum(['OPEN', 'CLOSED', 'DRAFT']).default('OPEN'),
});

export const updateJobSchema = createJobSchema.partial();

export const jobQuerySchema = paginationQuery.extend({
  q: z.string().max(200).optional(),
  location: z.string().max(255).optional(),
  employmentType: z
    .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE'])
    .optional(),
  status: z.enum(['OPEN', 'CLOSED', 'DRAFT']).optional(),
  companyId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'salaryMin', 'title']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
