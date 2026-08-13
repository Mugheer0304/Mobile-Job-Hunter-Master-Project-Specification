import { createHash, randomUUID } from 'crypto';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  RefreshTokenPayload,
} from '../utils/jwt';

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
}

export function toSafeUser(user: {
  id: string;
  email: string;
  fullName: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function issueTokens(user: { id: string; email: string; role: string }, meta?: { userAgent?: string; ip?: string }) {
  const jti = randomUUID();

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, jti });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
      userAgent: meta?.userAgent,
      ip: meta?.ip,
    },
  });

  return { accessToken, refreshToken };
}

export async function register(input: {
  email: string;
  password: string;
  fullName: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      profile: { create: {} },
    },
  });

  const tokens = await issueTokens(user);
  return { user: toSafeUser(user), ...tokens };
}

export async function login(
  input: { email: string; password: string },
  meta?: { userAgent?: string; ip?: string },
) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  const tokens = await issueTokens(user, meta);
  return { user: toSafeUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload: RefreshTokenPayload;
  try {
    payload = verifyToken<RefreshTokenPayload>(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }
  if (payload.type !== 'refresh') throw ApiError.unauthorized('Invalid refresh token');

  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash: hashToken(refreshToken) },
  });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token expired or revoked');
  }

  // Rotate: revoke the used token, issue a fresh pair.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
  const tokens = await issueTokens(user);
  return { user: toSafeUser(user), ...tokens };
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Current password is incorrect');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  // Invalidate all existing refresh tokens after a password change.
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) throw ApiError.notFound('User not found');
  return { ...toSafeUser(user), profile: user.profile };
}
