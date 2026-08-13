import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

export function verifyToken<T>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET) as T;
}
