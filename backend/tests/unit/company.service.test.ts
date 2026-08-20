import { prisma } from '../../src/config/prisma';
import {
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../../src/services/company.service';

jest.mock('../../src/config/prisma', () => ({
  prisma: {
    company: {
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
  company: {
    findMany: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const company = {
  id: 'c1',
  name: 'Acme Corp',
  website: 'https://acme.example',
  createdById: 'u1',
  createdAt: new Date('2024-01-01'),
};

describe('company.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listCompanies', () => {
    it('returns paginated companies ordered by name', async () => {
      prismaMock.company.findMany.mockResolvedValue([company]);
      prismaMock.company.count.mockResolvedValue(1);

      const result = await listCompanies({ page: 1, limit: 20 });

      expect(result.companies).toHaveLength(1);
      expect(result.totalPages).toBe(1);
      expect(prismaMock.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, orderBy: { name: 'asc' }, skip: 0, take: 20 }),
      );
    });

    it('filters by name when a query is provided', async () => {
      prismaMock.company.findMany.mockResolvedValue([]);
      prismaMock.company.count.mockResolvedValue(0);

      await listCompanies({ q: 'acme', page: 1, limit: 20 });

      const where = prismaMock.company.findMany.mock.calls[0][0].where;
      expect(where).toEqual({ name: { contains: 'acme', mode: 'insensitive' } });
    });
  });

  describe('getCompany', () => {
    it('returns the company with open jobs when found', async () => {
      prismaMock.company.findUnique.mockResolvedValue({ ...company, jobs: [] });

      const result = await getCompany('c1');

      expect(result.id).toBe('c1');
      expect(result.jobs).toEqual([]);
      expect(prismaMock.company.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'c1' } }),
      );
    });

    it('throws notFound when missing', async () => {
      prismaMock.company.findUnique.mockResolvedValue(null);

      await expect(getCompany('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('createCompany', () => {
    it('creates the company with the creator id', async () => {
      prismaMock.company.create.mockResolvedValue(company);

      // createdById is added by the service; the controller passes the validated body.
      const result = await createCompany('u1', { name: 'Acme Corp', createdById: 'u1' });

      expect(result.id).toBe('c1');
      expect(prismaMock.company.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: 'Acme Corp', createdById: 'u1' }) }),
      );
    });
  });

  describe('updateCompany', () => {
    it('updates an existing company', async () => {
      prismaMock.company.findUniqueOrThrow.mockResolvedValue(company);
      prismaMock.company.update.mockResolvedValue({ ...company, name: 'Acme Inc' });

      const result = await updateCompany('c1', { name: 'Acme Inc' });

      expect(result.name).toBe('Acme Inc');
      expect(prismaMock.company.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { name: 'Acme Inc' } });
    });

    it('throws when the company does not exist', async () => {
      prismaMock.company.findUniqueOrThrow.mockRejectedValue(new Error('not found'));

      await expect(updateCompany('missing', { name: 'X' })).rejects.toThrow();
    });
  });

  describe('deleteCompany', () => {
    it('deletes an existing company', async () => {
      prismaMock.company.findUniqueOrThrow.mockResolvedValue(company);
      prismaMock.company.delete.mockResolvedValue(company);

      await deleteCompany('c1');

      expect(prismaMock.company.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });

    it('throws when the company does not exist', async () => {
      prismaMock.company.findUniqueOrThrow.mockRejectedValue(new Error('not found'));

      await expect(deleteCompany('missing')).rejects.toThrow();
    });
  });
});
