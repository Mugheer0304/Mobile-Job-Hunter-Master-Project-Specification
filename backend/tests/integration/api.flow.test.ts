import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { signAccessToken } from '../../src/utils/jwt';
import { hashPassword } from '../../src/utils/password';

jest.mock('../../src/config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    profile: { upsert: jest.fn(), findUnique: jest.fn() },
    job: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
    experience: { create: jest.fn(), deleteMany: jest.fn() },
    education: { create: jest.fn(), deleteMany: jest.fn() },
    skill: { upsert: jest.fn(), deleteMany: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  user: { findUnique: jest.Mock; findUniqueOrThrow: jest.Mock; create: jest.Mock; update: jest.Mock };
  refreshToken: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
  profile: { upsert: jest.Mock; findUnique: jest.Mock };
  job: { findMany: jest.Mock; count: jest.Mock; findUnique: jest.Mock; findUniqueOrThrow: jest.Mock };
  experience: { create: jest.Mock; deleteMany: jest.Mock };
  education: { create: jest.Mock; deleteMany: jest.Mock };
  skill: { upsert: jest.Mock; deleteMany: jest.Mock };
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

describe('auth flow (integration)', () => {
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hashPassword('Password123!');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('register → login → me round trip', async () => {
    // register: no existing user, create succeeds, refresh token stored
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      ...baseUser,
      passwordHash,
    });
    prismaMock.refreshToken.create.mockResolvedValue({ id: 'rt1' });

    const registerRes = await request(app).post('/api/v1/auth/register').send({
      email: 'alice@mjh.dev',
      password: 'Password123!',
      fullName: 'Alice',
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.accessToken).toBeDefined();
    expect(registerRes.body.data.user).not.toHaveProperty('passwordHash');

    // login with the same (mocked) user
    prismaMock.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash,
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'alice@mjh.dev',
      password: 'Password123!',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.refreshToken).toBeDefined();

    // /auth/me with the issued access token
    const accessToken = signAccessToken({ sub: 'u1', email: 'alice@mjh.dev', role: 'USER' });
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, profile: null });

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('alice@mjh.dev');
  });

  it('rejects a duplicate registration with 409', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'alice@mjh.dev',
      password: 'Password123!',
      fullName: 'Alice',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid registration payloads with 400', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: 'short',
      fullName: '',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('requires a bearer token for /auth/me', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('job routes (integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists jobs publicly', async () => {
    prismaMock.job.findMany.mockResolvedValue([
      { id: 'j1', title: 'Engineer', status: 'OPEN', createdAt: new Date() },
    ]);
    prismaMock.job.count.mockResolvedValue(1);

    const res = await request(app).get('/api/v1/jobs');

    expect(res.status).toBe(200);
    expect(res.body.data.jobs).toHaveLength(1);
    expect(res.body.data.totalPages).toBe(1);
  });

  it('returns 401 when creating a job without a token', async () => {
    const res = await request(app).post('/api/v1/jobs').send({
      title: 'Engineer',
      description: 'Build things',
      companyId: 'c1',
    });

    expect(res.status).toBe(401);
  });

  it('returns 404 for an unknown job', async () => {
    prismaMock.job.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/v1/jobs/unknown-id');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('user profile routes (integration)', () => {
  const token = signAccessToken({ sub: 'u1', email: 'alice@mjh.dev', role: 'USER' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the profile for the authenticated user', async () => {
    prismaMock.profile.upsert.mockResolvedValue({ id: 'p1' });
    prismaMock.user.findUnique.mockResolvedValue({
      ...baseUser,
      profile: { id: 'p1', headline: 'Senior Engineer', experiences: [], educations: [], skills: [] },
    });

    const res = await request(app)
      .put('/api/v1/users/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ headline: 'Senior Engineer' });

    expect(res.status).toBe(200);
    expect(res.body.data.profile.headline).toBe('Senior Engineer');
    expect(prismaMock.profile.upsert).toHaveBeenCalled();
  });

  it('adds a skill for the authenticated user', async () => {
    prismaMock.profile.upsert.mockResolvedValue({ id: 'p1' });
    prismaMock.skill.upsert.mockResolvedValue({ id: 's1' });
    prismaMock.user.findUnique.mockResolvedValue({
      ...baseUser,
      profile: { id: 'p1', experiences: [], educations: [], skills: [{ id: 's1', name: 'TypeScript' }] },
    });

    const res = await request(app)
      .post('/api/v1/users/me/skills')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'TypeScript' });

    expect(res.status).toBe(201);
    expect(res.body.data.profile.skills).toHaveLength(1);
  });

  it('rejects invalid skill payloads with 400', async () => {
    const res = await request(app)
      .post('/api/v1/users/me/skills')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
  });
});
