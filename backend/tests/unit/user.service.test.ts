import { Prisma } from '@prisma/client';
import { prisma } from '../../src/config/prisma';
import {
  getUserById,
  updateProfile,
  updateMe,
  addExperience,
  removeExperience,
  addEducation,
  removeEducation,
  addSkill,
  removeSkill,
} from '../../src/services/user.service';

jest.mock('../../src/config/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    profile: { upsert: jest.fn(), findUnique: jest.fn() },
    experience: { create: jest.fn(), deleteMany: jest.fn() },
    education: { create: jest.fn(), deleteMany: jest.fn() },
    skill: { upsert: jest.fn(), deleteMany: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  user: { findUnique: jest.Mock; update: jest.Mock };
  profile: { upsert: jest.Mock; findUnique: jest.Mock };
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
  createdAt: new Date('2024-01-01'),
};

const userWithProfile = {
  ...baseUser,
  profile: { id: 'p1', userId: 'u1', headline: 'Engineer', experiences: [], educations: [], skills: [] },
};

describe('user.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('throws notFound when the user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(getUserById('missing')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('returns a safe user with their profile', async () => {
      prismaMock.user.findUnique.mockResolvedValue(userWithProfile);

      const result = await getUserById('u1');

      expect(result.id).toBe('u1');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.profile).toEqual(expect.objectContaining({ id: 'p1' }));
    });
  });

  describe('updateProfile', () => {
    it('upserts the profile and returns the refreshed user', async () => {
      prismaMock.profile.upsert.mockResolvedValue({ id: 'p1' });
      prismaMock.user.findUnique.mockResolvedValue(userWithProfile);

      const result = await updateProfile('u1', { headline: 'Senior Engineer' });

      expect(prismaMock.profile.upsert).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        update: { headline: 'Senior Engineer' },
        create: { userId: 'u1', headline: 'Senior Engineer' },
      });
      expect(result.profile).toBeDefined();
    });
  });

  describe('updateMe', () => {
    it('updates the user and returns the fresh profile', async () => {
      prismaMock.user.update.mockResolvedValue({ ...userWithProfile, fullName: 'Alice B.' });
      prismaMock.user.findUnique.mockResolvedValue({ ...userWithProfile, fullName: 'Alice B.' });

      const result = await updateMe('u1', { fullName: 'Alice B.' });

      expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { fullName: 'Alice B.' } });
      expect(result.fullName).toBe('Alice B.');
    });
  });

  describe('addExperience / removeExperience', () => {
    it('creates an experience against the user profile', async () => {
      prismaMock.profile.upsert.mockResolvedValue({ id: 'p1' });
      prismaMock.experience.create.mockResolvedValue({ id: 'e1' });
      prismaMock.user.findUnique.mockResolvedValue(userWithProfile);

      // profileId is added by the service; the controller passes the validated body.
      await addExperience('u1', {
        title: 'Engineer',
        company: 'Acme',
        startDate: new Date('2020-01-01'),
      } as Prisma.ExperienceUncheckedCreateInput);

      expect(prismaMock.experience.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ profileId: 'p1' }) }),
      );
    });

    it('throws notFound when the profile is missing on removal', async () => {
      prismaMock.profile.findUnique.mockResolvedValue(null);

      await expect(removeExperience('u1', 'e1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('deletes only experiences owned by the user profile', async () => {
      prismaMock.profile.findUnique.mockResolvedValue({ id: 'p1' });
      prismaMock.experience.deleteMany.mockResolvedValue({ count: 1 });

      await removeExperience('u1', 'e1');

      expect(prismaMock.experience.deleteMany).toHaveBeenCalledWith({
        where: { id: 'e1', profileId: 'p1' },
      });
    });
  });

  describe('addEducation / removeEducation', () => {
    it('creates an education entry', async () => {
      prismaMock.profile.upsert.mockResolvedValue({ id: 'p1' });
      prismaMock.education.create.mockResolvedValue({ id: 'ed1' });
      prismaMock.user.findUnique.mockResolvedValue(userWithProfile);

      // profileId is added by the service; the controller passes the validated body.
      await addEducation('u1', {
        school: 'MIT',
        degree: 'BS',
        startDate: new Date('2015-01-01'),
      } as Prisma.EducationUncheckedCreateInput);

      expect(prismaMock.education.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ profileId: 'p1' }) }),
      );
    });

    it('deletes only educations owned by the user profile', async () => {
      prismaMock.profile.findUnique.mockResolvedValue({ id: 'p1' });
      prismaMock.education.deleteMany.mockResolvedValue({ count: 1 });

      await removeEducation('u1', 'ed1');

      expect(prismaMock.education.deleteMany).toHaveBeenCalledWith({
        where: { id: 'ed1', profileId: 'p1' },
      });
    });
  });

  describe('addSkill / removeSkill', () => {
    it('upserts a skill on the user profile', async () => {
      prismaMock.profile.upsert.mockResolvedValue({ id: 'p1' });
      prismaMock.skill.upsert.mockResolvedValue({ id: 's1' });
      prismaMock.user.findUnique.mockResolvedValue(userWithProfile);

      await addSkill('u1', 'TypeScript');

      expect(prismaMock.skill.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { profileId_name: { profileId: 'p1', name: 'TypeScript' } },
        }),
      );
    });

    it('deletes only skills owned by the user profile', async () => {
      prismaMock.profile.findUnique.mockResolvedValue({ id: 'p1' });
      prismaMock.skill.deleteMany.mockResolvedValue({ count: 1 });

      await removeSkill('u1', 'TypeScript');

      expect(prismaMock.skill.deleteMany).toHaveBeenCalledWith({
        where: { profileId: 'p1', name: 'TypeScript' },
      });
    });
  });
});
