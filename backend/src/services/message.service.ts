import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export async function listConversations(userId: string) {
  return prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: { include: { user: { select: { id: true, fullName: true, profile: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOrCreateConversation(userId: string, otherUserId: string) {
  if (userId === otherUserId) throw ApiError.badRequest('Cannot message yourself');

  const other = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!other) throw ApiError.notFound('User not found');

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: otherUserId } } },
      ],
    },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId }, { userId: otherUserId }],
      },
    },
  });
}

export async function sendMessage(senderId: string, conversationId: string, content: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });
  if (!conversation) throw ApiError.notFound('Conversation not found');
  if (!conversation.participants.some((p) => p.userId === senderId)) {
    throw ApiError.forbidden('Not a participant in this conversation');
  }

  const message = await prisma.message.create({
    data: { conversationId, senderId, content },
  });

  // Notify other participants.
  const recipients = conversation.participants.filter((p) => p.userId !== senderId);
  await prisma.notification.createMany({
    data: recipients.map((r) => ({
      userId: r.userId,
      type: 'MESSAGE',
      title: 'New message',
      body: content.slice(0, 200),
    })),
  });

  return message;
}

export async function listMessages(userId: string, conversationId: string, query: { page: number; limit: number }) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });
  if (!conversation) throw ApiError.notFound('Conversation not found');
  if (!conversation.participants.some((p) => p.userId === userId)) {
    throw ApiError.forbidden('Not a participant in this conversation');
  }

  const { page, limit } = query;
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return { messages, total, page, limit, totalPages: Math.ceil(total / limit) };
}
