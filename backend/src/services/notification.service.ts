import { prisma } from '../config/prisma';

export async function listNotifications(
  userId: string,
  query: { unreadOnly?: boolean; page: number; limit: number },
) {
  const { unreadOnly, page, limit } = query;
  const where = {
    userId,
    ...(unreadOnly ? { readAt: null } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return { notifications, total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function markRead(userId: string, ids?: string[], all = false) {
  if (all) {
    return prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }
  if (ids && ids.length) {
    return prisma.notification.updateMany({
      where: { userId, id: { in: ids }, readAt: null },
      data: { readAt: new Date() },
    });
  }
  return { count: 0 };
}
