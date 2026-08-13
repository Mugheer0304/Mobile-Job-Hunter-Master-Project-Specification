import { NextFunction, Request, Response } from 'express';
import { ZodSchema, ZodError } from 'zod';

type Source = 'body' | 'query' | 'params';

// Validates a request segment (body/query/params) against a zod schema,
// replacing the request value with the parsed result.
export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      (req as unknown as Record<Source, unknown>)[source] = parsed;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        return next(
          Object.assign(new Error('Validation failed'), {
            statusCode: 400,
            details,
            isOperational: true,
          }),
        );
      }
      return next(err);
    }
  };
}
