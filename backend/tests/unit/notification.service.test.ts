import { prisma } from '../../src/config/prisma';
import { listNotifications, markRead } from '../../src/services/notification.service';

jest.mock('../../src/config/prisma', () => ({
  prisma: {
    notification: { findMany: jest.fn(), count: jest.fn(), updateMany: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  notification: { findMany: jest.Mock; count: jest.Mock; updateMany: jest.Mock };
};

const notification = {
  id: 'n1',
  userId: 'u1',
  type: 'CONNECTION_REQUEST',
  title: 'New connection request',
  body: 'Someone wants to connect',
  readAt: null,
  createdAt: new Date('2024-01-01'),
};

describe('notification.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listNotifications', () => {
    it('returns paginated notifications with an unread count', async () => {
      prismaMock.notification.findMany.mockResolvedValue([notification]);
      prismaMock.notification.count.mockResolvedValue(1);

      const result = await listNotifications('u1', { page: 1, limit: 20 });

      expect(result.notifications).toHaveLength(1);
      expect(result.unreadCount).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1' }, skip: 0, take: 20 }),
      );
    });

    it('filters unread only when requested', async () => {
      prismaMock.notification.findMany.mockResolvedValue([]);
      prismaMock.notification.count.mockResolvedValue(0);

      await listNotifications('u1', { unreadOnly: true, page: 1, limit: 20 });

      const where = prismaMock.notification.findMany.mock.calls[0][0].where;
      expect(where).toEqual({ userId: 'u1', readAt: null });
    });
  });

  describe('markRead', () => {
    it('marks all notifications read when all is true', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await markRead('u1', undefined, true);

      expect(result.count).toBe(3);
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1', readAt: null } }),
      );
    });

    it('marks specific ids read', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 2 });

      const result = await markRead('u1', ['n1', 'n2']);

      expect(result.count).toBe(2);
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1', id: { in: ['n1', 'n2'] }, readAt: null } }),
      );
    });

    it('returns zero when no ids are given and all is false', async () => {
      const result = await markRead('u1');

      expect(result).toEqual({ count: 0 });
      expect(prismaMock.notification.updateMany).not.toHaveBeenCalled();
    });
  });
});
