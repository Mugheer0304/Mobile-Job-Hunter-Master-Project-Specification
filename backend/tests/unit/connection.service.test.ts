import { prisma } from '../../src/config/prisma';
import {
  sendRequest,
  respond,
  listConnections,
  listPending,
} from '../../src/services/connection.service';

jest.mock('../../src/config/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    connection: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    notification: { create: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  user: { findUnique: jest.Mock };
  connection: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  notification: { create: jest.Mock };
};

const connection = {
  id: 'c1',
  requesterId: 'u1',
  addresseeId: 'u2',
  status: 'PENDING',
  createdAt: new Date('2024-01-01'),
};

describe('connection.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendRequest', () => {
    it('rejects connecting with yourself', async () => {
      await expect(sendRequest('u1', 'u1')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws notFound when the addressee does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(sendRequest('u1', 'missing')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws conflict when a connection already exists in either direction', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u2', fullName: 'Bob' });
      prismaMock.connection.findFirst.mockResolvedValue(connection);

      await expect(sendRequest('u1', 'u2')).rejects.toMatchObject({ statusCode: 409 });
    });

    it('creates the request and notifies the addressee', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u2', fullName: 'Bob' });
      prismaMock.connection.findFirst.mockResolvedValue(null);
      prismaMock.connection.create.mockResolvedValue(connection);
      prismaMock.notification.create.mockResolvedValue({ id: 'n1' });

      const result = await sendRequest('u1', 'u2');

      expect(result.status).toBe('PENDING');
      expect(prismaMock.connection.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { requesterId: 'u1', addresseeId: 'u2', status: 'PENDING' } }),
      );
      expect(prismaMock.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'u2' }) }),
      );
    });
  });

  describe('respond', () => {
    it('throws notFound for a missing request', async () => {
      prismaMock.connection.findUnique.mockResolvedValue(null);

      await expect(respond('u2', 'c1', 'ACCEPTED')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('forbids the requester from responding', async () => {
      prismaMock.connection.findUnique.mockResolvedValue(connection);

      await expect(respond('u1', 'c1', 'ACCEPTED')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('accepts a request as the addressee', async () => {
      prismaMock.connection.findUnique.mockResolvedValue(connection);
      prismaMock.connection.update.mockResolvedValue({ ...connection, status: 'ACCEPTED' });

      const result = await respond('u2', 'c1', 'ACCEPTED');

      expect(result.status).toBe('ACCEPTED');
      expect(prismaMock.connection.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { status: 'ACCEPTED' },
      });
    });
  });

  describe('listConnections', () => {
    it('returns paginated connections for the user', async () => {
      prismaMock.connection.findMany.mockResolvedValue([connection]);
      prismaMock.connection.count.mockResolvedValue(1);

      const result = await listConnections('u1', { page: 1, limit: 20 });

      expect(result.connections).toHaveLength(1);
      expect(result.totalPages).toBe(1);
      expect(prismaMock.connection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: [{ requesterId: 'u1' }, { addresseeId: 'u1' }] }),
          skip: 0,
          take: 20,
        }),
      );
    });

    it('filters by status when provided', async () => {
      prismaMock.connection.findMany.mockResolvedValue([]);
      prismaMock.connection.count.mockResolvedValue(0);

      await listConnections('u1', { status: 'ACCEPTED', page: 1, limit: 20 });

      const where = prismaMock.connection.findMany.mock.calls[0][0].where;
      expect(where.status).toBe('ACCEPTED');
    });
  });

  describe('listPending', () => {
    it('returns pending requests addressed to the user', async () => {
      prismaMock.connection.findMany.mockResolvedValue([connection]);

      const result = await listPending('u2');

      expect(result).toHaveLength(1);
      expect(prismaMock.connection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { addresseeId: 'u2', status: 'PENDING' } }),
      );
    });
  });
});
