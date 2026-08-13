import { ConnectionStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export async function sendRequest(requesterId: string, addresseeId: string) {
  if (requesterId === addresseeId) throw ApiError.badRequest('You cannot connect with yourself');

  const addressee = await prisma.user.findUnique({ where: { id: addresseeId } });
  if (!addressee) throw ApiError.notFound('User not found');

  // Check for an existing connection in either direction.
  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
  });
  if (existing) throw ApiError.conflict('A connection request already exists');

  const connection = await prisma.connection.create({
    data: { requesterId, addresseeId, status: 'PENDING' },
  });

  await prisma.notification.create({
    data: {
      userId: addresseeId,
      type: 'CONNECTION_REQUEST',
      title: 'New connection request',
      body: 'Someone wants to connect with you.',
    },
  });

  return connection;
}

export async function respond(userId: string, id: string, status: 'ACCEPTED' | 'REJECTED') {
  const connection = await prisma.connection.findUnique({ where: { id } });
  if (!connection) throw ApiError.notFound('Connection request not found');
  if (connection.addresseeId !== userId) throw ApiError.forbidden('Not authorized');

  return prisma.connection.update({ where: { id }, data: { status } });
}

export async function listConnections(
  userId: string,
  query: { status?: string; page: number; limit: number },
) {
  const { status, page, limit } = query;
  const where = {
    OR: [{ requesterId: userId }, { addresseeId: userId }],
    ...(status ? { status: status as ConnectionStatus } : {}),
  };

  const [connections, total] = await Promise.all([
    prisma.connection.findMany({
      where,
      include: {
        requester: { select: { id: true, fullName: true, profile: true } },
        addressee: { select: { id: true, fullName: true, profile: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.connection.count({ where }),
  ]);

  return { connections, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function listPending(userId: string) {
  return prisma.connection.findMany({
    where: { addresseeId: userId, status: 'PENDING' },
    include: { requester: { select: { id: true, fullName: true, profile: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
