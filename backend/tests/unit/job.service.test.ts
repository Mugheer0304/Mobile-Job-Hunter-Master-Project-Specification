import { prisma } from '../../src/config/prisma';
import { listJobs, getJobById, createJob, updateJob, deleteJob } from '../../src/services/job.service';

jest.mock('../../src/config/prisma', () => ({
  prisma: {
    job: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  job: {
    findMany: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const job = {
  id: 'j1',
  title: 'Backend Engineer',
  description: 'Build APIs',
  status: 'OPEN',
  employmentType: 'FULL_TIME',
  companyId: 'c1',
  postedById: 'u1',
  skills: ['node', 'typescript'],
  createdAt: new Date('2024-01-01'),
};

describe('job.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listJobs', () => {
    it('defaults to OPEN status and paginates', async () => {
      prismaMock.job.findMany.mockResolvedValue([job]);
      prismaMock.job.count.mockResolvedValue(1);

      const result = await listJobs({ page: 1, limit: 20 });

      expect(result.jobs).toHaveLength(1);
      expect(result.totalPages).toBe(1);
      expect(prismaMock.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'OPEN' }), skip: 0, take: 20 }),
      );
    });

    it('applies search, location and sorting filters', async () => {
      prismaMock.job.findMany.mockResolvedValue([]);
      prismaMock.job.count.mockResolvedValue(0);

      await listJobs({
        q: 'engineer',
        location: 'Remote',
        employmentType: 'CONTRACT',
        sortBy: 'salaryMin',
        order: 'asc',
        page: 2,
        limit: 10,
      });

      const findManyArgs = prismaMock.job.findMany.mock.calls[0][0];
      expect(findManyArgs.where).toEqual(
        expect.objectContaining({
          status: 'OPEN',
          employmentType: 'CONTRACT',
          location: { contains: 'Remote', mode: 'insensitive' },
          OR: expect.any(Array),
        }),
      );
      expect(findManyArgs.orderBy).toEqual({ salaryMin: 'asc' });
      expect(findManyArgs.skip).toBe(10);
    });
  });

  describe('getJobById', () => {
    it('returns the job when found', async () => {
      prismaMock.job.findUnique.mockResolvedValue(job);

      const result = await getJobById('j1');

      expect(result.id).toBe('j1');
      expect(prismaMock.job.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'j1' } }),
      );
    });

    it('throws notFound when missing', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(getJobById('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('createJob', () => {
    it('creates the job', async () => {
      prismaMock.job.create.mockResolvedValue(job);

      const result = await createJob({
        title: 'Backend Engineer',
        description: 'Build APIs',
        companyId: 'c1',
        postedById: 'u1',
      });

      expect(result.id).toBe('j1');
      expect(prismaMock.job.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ title: 'Backend Engineer' }) }),
      );
    });
  });

  describe('updateJob', () => {
    it('updates an existing job', async () => {
      prismaMock.job.findUniqueOrThrow.mockResolvedValue(job);
      prismaMock.job.update.mockResolvedValue({ ...job, title: 'Senior Engineer' });

      const result = await updateJob('j1', { title: 'Senior Engineer' });

      expect(result.title).toBe('Senior Engineer');
      expect(prismaMock.job.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'j1' } }),
      );
    });

    it('throws when the job does not exist', async () => {
      prismaMock.job.findUniqueOrThrow.mockRejectedValue(new Error('not found'));

      await expect(updateJob('missing', { title: 'X' })).rejects.toThrow();
    });
  });

  describe('deleteJob', () => {
    it('deletes an existing job', async () => {
      prismaMock.job.findUniqueOrThrow.mockResolvedValue(job);
      prismaMock.job.delete.mockResolvedValue(job);

      await deleteJob('j1');

      expect(prismaMock.job.delete).toHaveBeenCalledWith({ where: { id: 'j1' } });
    });

    it('throws when the job does not exist', async () => {
      prismaMock.job.findUniqueOrThrow.mockRejectedValue(new Error('not found'));

      await expect(deleteJob('missing')).rejects.toThrow();
    });
  });
});
