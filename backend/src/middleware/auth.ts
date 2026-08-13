import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyToken, AccessTokenPayload } from '../utils/jwt';

// Verifies the Bearer access token and attaches `req.user`.
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or invalid Authorization header'));
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyToken<AccessTokenPayload>(token);
    if (payload.type !== 'access') {
      return next(ApiError.unauthorized('Invalid token type'));
    }
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
}

// Restricts a route to the given roles.
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }
    return next();
  };
}
