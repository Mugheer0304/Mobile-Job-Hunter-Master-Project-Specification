import { prisma } from '../../src/config/prisma';
import { listUsers, setUserActive, setUserRole, deleteUser, stats } from '../../src/services/admin.service';

jest.mock('../../src/config/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    job: { count: jest.fn() },
    application: { count: jest.fn() },
    company: { count: jest.fn() },
    post: { count: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  user: {
    findMany: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  job: { count: jest.Mock };
  application: { count: jest.Mock };
  company: { count: jest.Mock };
  post: { count: jest.Mock };
};

const user = {
  id: 'u1',
  email: 'alice@mjh.dev',
  fullName: 'Alice',
  role: 'USER',
  isActive: true,
  createdAt: new Date('2024-01-01'),
};

describe('admin.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('returns paginated users', async () => {
      prismaMock.user.findMany.mockResolvedValue([user]);
      prismaMock.user.count.mockResolvedValue(1);

      const result = await listUsers({ page: 1, limit: 20 });

      expect(result.users).toHaveLength(1);
      expect(result.totalPages).toBe(1);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20, orderBy: { createdAt: 'desc' } }),
      );
    });
  });

  describe('setUserActive', () => {
    it('throws notFound when the user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(setUserActive('missing', false)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('updates the active flag', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.user.update.mockResolvedValue({ ...user, isActive: false });

      const result = await setUserActive('u1', false);

      expect(result.isActive).toBe(false);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { isActive: false },
      });
    });
  });

  describe('setUserRole', () => {
    it('throws notFound when the user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(setUserRole('missing', 'ADMIN')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('updates the role', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.user.update.mockResolvedValue({ ...user, role: 'ADMIN' });

      const result = await setUserRole('u1', 'ADMIN');

      expect(result.role).toBe('ADMIN');
      expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { role: 'ADMIN' } });
    });
  });

  describe('deleteUser', () => {
    it('deletes an existing user', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(user);
      prismaMock.user.delete.mockResolvedValue(user);

      await deleteUser('u1');

      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });

    it('throws when the user does not exist', async () => {
      prismaMock.user.findUniqueOrThrow.mockRejectedValue(new Error('not found'));

      await expect(deleteUser('missing')).rejects.toThrow();
    });
  });

  describe('stats', () => {
    it('returns platform counts', async () => {
      prismaMock.user.count.mockResolvedValue(10);
      prismaMock.job.count.mockResolvedValue(5);
      prismaMock.application.count.mockResolvedValue(3);
      prismaMock.company.count.mockResolvedValue(2);
      prismaMock.post.count.mockResolvedValue(7);

      const result = await stats();

      expect(result).toEqual({ users: 10, jobs: 5, applications: 3, companies: 2, posts: 7 });
    });
  });
});
