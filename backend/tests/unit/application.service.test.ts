import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../../src/config/prisma';
import {
  apply,
  listMyApplications,
  listJobApplications,
  updateApplicationStatus,
} from '../../src/services/application.service';

jest.mock('../../src/config/prisma', () => ({
  prisma: {
    job: { findUnique: jest.fn() },
    application: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  job: { findUnique: jest.Mock };
  application: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

const openJob = { id: 'j1', status: 'OPEN', postedById: 'u2', companyId: 'c1' };
const closedJob = { id: 'j1', status: 'CLOSED', postedById: 'u2', companyId: 'c1' };
const application = {
  id: 'a1',
  jobId: 'j1',
  userId: 'u1',
  status: 'PENDING',
  createdAt: new Date('2024-01-01'),
};

describe('application.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('apply', () => {
    it('throws notFound when the job does not exist', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(apply('u1', { jobId: 'missing' })).rejects.toMatchObject({ statusCode: 404 });
    });

    it('rejects applications to a closed job', async () => {
      prismaMock.job.findUnique.mockResolvedValue(closedJob);

      await expect(apply('u1', { jobId: 'j1' })).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws conflict when already applied', async () => {
      prismaMock.job.findUnique.mockResolvedValue(openJob);
      prismaMock.application.findUnique.mockResolvedValue(application);

      await expect(apply('u1', { jobId: 'j1' })).rejects.toMatchObject({ statusCode: 409 });
    });

    it('creates the application', async () => {
      prismaMock.job.findUnique.mockResolvedValue(openJob);
      prismaMock.application.findUnique.mockResolvedValue(null);
      prismaMock.application.create.mockResolvedValue(application);

      const result = await apply('u1', { jobId: 'j1', coverLetter: 'Hire me' });

      expect(result.id).toBe('a1');
      expect(prismaMock.application.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ jobId: 'j1', userId: 'u1' }) }),
      );
    });
  });

  describe('listMyApplications', () => {
    it('returns paginated applications for the user', async () => {
      prismaMock.application.findMany.mockResolvedValue([application]);
      prismaMock.application.count.mockResolvedValue(1);

      const result = await listMyApplications('u1', { page: 1, limit: 20 });

      expect(result.applications).toHaveLength(1);
      expect(result.totalPages).toBe(1);
      expect(prismaMock.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1' }, skip: 0, take: 20 }),
      );
    });
  });

  describe('listJobApplications', () => {
    it('throws notFound when the job does not exist', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(listJobApplications('missing', 'u2', { page: 1, limit: 20 })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('forbids non-poster from viewing applicants', async () => {
      prismaMock.job.findUnique.mockResolvedValue(openJob);

      await expect(listJobApplications('j1', 'someone-else', { page: 1, limit: 20 })).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('returns applicants to the job poster', async () => {
      prismaMock.job.findUnique.mockResolvedValue(openJob);
      prismaMock.application.findMany.mockResolvedValue([application]);
      prismaMock.application.count.mockResolvedValue(1);

      const result = await listJobApplications('j1', 'u2', { page: 1, limit: 20 });

      expect(result.applications).toHaveLength(1);
      expect(prismaMock.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { jobId: 'j1' } }),
      );
    });
  });

  describe('updateApplicationStatus', () => {
    it('throws notFound when the application does not exist', async () => {
      prismaMock.application.findUnique.mockResolvedValue(null);

      await expect(updateApplicationStatus('missing', 'u2', ApplicationStatus.REVIEWING)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('forbids a stranger from updating', async () => {
      prismaMock.application.findUnique.mockResolvedValue({ ...application, job: openJob });

      await expect(updateApplicationStatus('a1', 'stranger', ApplicationStatus.REVIEWING)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('lets the applicant only withdraw', async () => {
      prismaMock.application.findUnique.mockResolvedValue({ ...application, job: openJob });

      await expect(updateApplicationStatus('a1', 'u1', ApplicationStatus.REVIEWING)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('lets the poster update any status', async () => {
      prismaMock.application.findUnique.mockResolvedValue({ ...application, job: openJob });
      prismaMock.application.update.mockResolvedValue({ ...application, status: 'REVIEWING' });

      const result = await updateApplicationStatus('a1', 'u2', ApplicationStatus.REVIEWING);

      expect(result.status).toBe('REVIEWING');
      expect(prismaMock.application.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { status: 'REVIEWING' },
      });
    });
  });
});
