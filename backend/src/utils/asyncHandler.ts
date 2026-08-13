import { NextFunction, Request, Response } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Wraps async route handlers so rejected promises are forwarded to the
// error-handling middleware instead of crashing the process.
export const asyncHandler =
  (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
