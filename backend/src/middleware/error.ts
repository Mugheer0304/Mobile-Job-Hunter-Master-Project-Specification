import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { isProd } from '../config/env';

interface HttpError extends Error {
  statusCode?: number;
  details?: unknown;
  isOperational?: boolean;
}

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Central error handler — maps known errors to consistent JSON responses.
export function errorHandler(err: HttpError, _req: Request, res: Response, _next: NextFunction) {
  let statusCode = err.statusCode ?? 500;
  let message = err.message || 'Internal server error';
  const details = err.details;

  // Prisma known request errors -> 4xx
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'A record with that value already exists';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    } else {
      statusCode = 400;
      message = 'Database request failed';
    }
  }

  if (statusCode >= 500) {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(!isProd && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}
