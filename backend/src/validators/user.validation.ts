import { z } from 'zod';

export const updateProfileSchema = z.object({
  headline: z.string().max(255).optional().nullable(),
  summary: z.string().max(5000).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  resumeUrl: z.string().url().max(500).optional().nullable(),
  website: z.string().url().max(500).optional().nullable(),
});

export const updateMeSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
});

export const experienceSchema = z.object({
  title: z.string().min(1).max(120),
  company: z.string().min(1).max(120),
  location: z.string().max(255).optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  current: z.boolean().default(false),
  description: z.string().max(5000).optional().nullable(),
});

export const educationSchema = z.object({
  school: z.string().min(1).max(200),
  degree: z.string().max(200).optional().nullable(),
  field: z.string().max(200).optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
});

export const skillSchema = z.object({
  name: z.string().min(1).max(100),
});
