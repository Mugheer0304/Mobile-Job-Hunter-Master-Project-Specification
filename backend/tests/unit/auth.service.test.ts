import { signRefreshToken } from '../../src/utils/jwt';
import { hashPassword } from '../../src/utils/password';
import { prisma } from '../../src/config/prisma';
import {
  register,
  login,
  refresh,
  logout,
  changePassword,
  getMe,
} from '../../src/services/auth.service';

jest.mock('../../src/config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    findUniqueOrThrow: jest.Mock;
  };
  refreshToken: {
    create: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
};

const baseUser = {
  id: 'u1',
  email: 'alice@mjh.dev',
  fullName: 'Alice',
  role: 'USER',
  emailVerified: false,
  isActive: true,
  createdAt: new Date('2024-01-01'),
};

describe('auth.service', () => {
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hashPassword('Password123!');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('throws conflict when the email is already taken', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

      await expect(
        register({ email: 'alice@mjh.dev', password: 'Password123!', fullName: 'Alice' }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('creates the user and issues token pair on success', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({ ...baseUser, passwordHash });
      prismaMock.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      const result = await register({
        email: 'alice@mjh.dev',
        password: 'Password123!',
        fullName: 'Alice',
      });

      expect(result.user.email).toBe('alice@mjh.dev');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ profile: { create: {} } }),
        }),
      );
      expect(prismaMock.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('throws unauthorized for an unknown email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(login({ email: 'nobody@mjh.dev', password: 'Password123!' })).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws unauthorized for a wrong password', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

      await expect(login({ email: 'alice@mjh.dev', password: 'WrongPass123!' })).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws forbidden when the account is deactivated', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...baseUser,
        passwordHash,
        isActive: false,
      });

      await expect(login({ email: 'alice@mjh.dev', password: 'Password123!' })).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('returns tokens and a safe user on success', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });
      prismaMock.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      const result = await login({ email: 'alice@mjh.dev', password: 'Password123!' }, { ip: '1.2.3.4' });

      expect(result.user.id).toBe('u1');
      expect(result.accessToken).toBeDefined();
      expect(prismaMock.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ ip: '1.2.3.4' }) }),
      );
    });
  });

  describe('refresh', () => {
    it('throws unauthorized for an invalid token', async () => {
      await expect(refresh('not-a-valid-token')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws unauthorized when the stored token is missing or revoked', async () => {
      const token = signRefreshToken({ sub: 'u1', jti: 'j1' });
      prismaMock.refreshToken.findFirst.mockResolvedValue(null);

      await expect(refresh(token)).rejects.toMatchObject({ statusCode: 401 });

      prismaMock.refreshToken.findFirst.mockResolvedValue({
        id: 'rt1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000),
      });

      await expect(refresh(token)).rejects.toMatchObject({ statusCode: 401 });
    });

    it('rotates the token and issues a fresh pair', async () => {
      const token = signRefreshToken({ sub: 'u1', jti: 'j1' });
      prismaMock.refreshToken.findFirst.mockResolvedValue({
        id: 'rt1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      });
      prismaMock.refreshToken.update.mockResolvedValue({ id: 'rt1', revokedAt: new Date() });
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({ ...baseUser, passwordHash });
      prismaMock.refreshToken.create.mockResolvedValue({ id: 'rt2' });

      const result = await refresh(token);

      expect(result.accessToken).toBeDefined();
      expect(prismaMock.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rt1' }, data: { revokedAt: expect.any(Date) } }),
      );
      expect(prismaMock.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revokes the matching refresh token', async () => {
      prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await logout('some-refresh-token');

      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ revokedAt: null }),
          data: { revokedAt: expect.any(Date) },
        }),
      );
    });
  });

  describe('changePassword', () => {
    it('throws unauthorized when the current password is wrong', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({
        ...baseUser,
        passwordHash: await hashPassword('OtherPass123!'),
      });

      await expect(changePassword('u1', 'WrongPass123!', 'NewPass123!')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('updates the hash and revokes all refresh tokens', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({ ...baseUser, passwordHash });
      prismaMock.user.update.mockResolvedValue({ ...baseUser, passwordHash });
      prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await changePassword('u1', 'Password123!', 'NewPass123!');

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u1' }, data: { passwordHash: expect.any(String) } }),
      );
      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1', revokedAt: null } }),
      );
    });
  });

  describe('getMe', () => {
    it('throws notFound when the user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(getMe('missing')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('returns the user with their profile', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...baseUser,
        passwordHash,
        profile: { id: 'p1', headline: 'Engineer' },
      });

      const result = await getMe('u1');

      expect(result.id).toBe('u1');
      expect(result.profile).toEqual(expect.objectContaining({ id: 'p1' }));
    });
  });
});
