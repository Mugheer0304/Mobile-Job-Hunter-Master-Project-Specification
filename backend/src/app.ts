import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProd } from './config/env';
import routes from './routes';
import { apiLimiter } from './middleware/rateLimiter';
import { notFound, errorHandler } from './middleware/error';
import { prisma } from './config/prisma';

export const app = express();

// Security headers
app.use(helmet());

// Strict CORS (no wildcard in production)
app.use(
  cors({
    origin: isProd ? env.CORS_ORIGIN.split(',').map((s) => s.trim()) : true,
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(morgan(isProd ? 'combined' : 'dev'));

// Health / readiness endpoints (no auth)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
});

// Rate limit all API traffic
app.use('/api', apiLimiter);

// API routes
app.use('/api/v1', routes);

// 404 + error handling
app.use(notFound);
app.use(errorHandler);
