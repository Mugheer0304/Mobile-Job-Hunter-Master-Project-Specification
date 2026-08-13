import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1).default('postgresql://mjh:mjh@localhost:5432/mjh?schema=public'),
  JWT_SECRET: z
    .string()
    .min(16)
    .default('dev-only-secret-change-me-0123456789'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_DAYS: z.coerce.number().default(7),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  REDIS_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

if (isProd && env.JWT_SECRET.startsWith('dev-only')) {
  throw new Error('JWT_SECRET must be changed from the dev default in production');
}
