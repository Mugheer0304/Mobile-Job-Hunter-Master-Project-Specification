import { z } from 'zod';
import { paginationQuery } from './common';

export const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(10000).optional().nullable(),
  website: z.string().url().max(500).optional().nullable(),
  logoUrl: z.string().url().max(500).optional().nullable(),
  industry: z.string().max(200).optional().nullable(),
  size: z.string().max(100).optional().nullable(),
  foundedYear: z.number().int().min(1800).max(2100).optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const companyQuerySchema = paginationQuery.extend({
  q: z.string().max(200).optional(),
});
