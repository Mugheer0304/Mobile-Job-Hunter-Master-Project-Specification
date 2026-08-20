import { prisma } from '../../src/config/prisma';
import {
  listConversations,
  getOrCreateConversation,
  sendMessage,
  listMessages,
} from '../../src/services/message.service';

jest.mock('../../src/config/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    conversation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    message: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    notification: { createMany: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  user: { findUnique: jest.Mock };
  conversation: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  message: { create: jest.Mock; findMany: jest.Mock; count: jest.Mock };
  notification: { createMany: jest.Mock };
};

const conversation = {
  id: 'cv1',
  createdAt: new Date('2024-01-01'),
  participants: [{ id: 'cp1', conversationId: 'cv1', userId: 'u1' }],
};

const message = {
  id: 'm1',
  conversationId: 'cv1',
  senderId: 'u1',
  content: 'Hello',
  createdAt: new Date('2024-01-01'),
};

describe('message.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listConversations', () => {
    it('returns conversations the user participates in', async () => {
      prismaMock.conversation.findMany.mockResolvedValue([conversation]);

      const result = await listConversations('u1');

      expect(result).toHaveLength(1);
      expect(prismaMock.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { participants: { some: { userId: 'u1' } } } }),
      );
    });
  });

  describe('getOrCreateConversation', () => {
    it('rejects messaging yourself', async () => {
      await expect(getOrCreateConversation('u1', 'u1')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws notFound when the other user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(getOrCreateConversation('u1', 'missing')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('returns the existing conversation when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u2', fullName: 'Bob' });
      prismaMock.conversation.findFirst.mockResolvedValue(conversation);

      const result = await getOrCreateConversation('u1', 'u2');

      expect(result.id).toBe('cv1');
      expect(prismaMock.conversation.create).not.toHaveBeenCalled();
    });

    it('creates a new conversation with both participants', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u2', fullName: 'Bob' });
      prismaMock.conversation.findFirst.mockResolvedValue(null);
      prismaMock.conversation.create.mockResolvedValue(conversation);

      const result = await getOrCreateConversation('u1', 'u2');

      expect(result.id).toBe('cv1');
      expect(prismaMock.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ participants: { create: [{ userId: 'u1' }, { userId: 'u2' }] } }) }),
      );
    });
  });

  describe('sendMessage', () => {
    it('throws notFound for a missing conversation', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue(null);

      await expect(sendMessage('u1', 'cv1', 'Hi')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('forbids non-participants from sending', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        ...conversation,
        participants: [{ id: 'cp1', conversationId: 'cv1', userId: 'u2' }],
      });

      await expect(sendMessage('u1', 'cv1', 'Hi')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('creates the message and notifies other participants', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        ...conversation,
        participants: [
          { id: 'cp1', conversationId: 'cv1', userId: 'u1' },
          { id: 'cp2', conversationId: 'cv1', userId: 'u2' },
        ],
      });
      prismaMock.message.create.mockResolvedValue(message);
      prismaMock.notification.createMany.mockResolvedValue({ count: 1 });

      const result = await sendMessage('u1', 'cv1', 'Hello');

      expect(result.id).toBe('m1');
      expect(prismaMock.message.create).toHaveBeenCalledWith({
        data: { conversationId: 'cv1', senderId: 'u1', content: 'Hello' },
      });
      expect(prismaMock.notification.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [expect.objectContaining({ userId: 'u2', type: 'MESSAGE' })],
        }),
      );
    });
  });

  describe('listMessages', () => {
    it('throws notFound for a missing conversation', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue(null);

      await expect(listMessages('u1', 'cv1', { page: 1, limit: 20 })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('forbids non-participants', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        ...conversation,
        participants: [{ id: 'cp1', conversationId: 'cv1', userId: 'u2' }],
      });

      await expect(listMessages('u1', 'cv1', { page: 1, limit: 20 })).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('returns paginated messages to a participant', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue(conversation);
      prismaMock.message.findMany.mockResolvedValue([message]);
      prismaMock.message.count.mockResolvedValue(1);

      const result = await listMessages('u1', 'cv1', { page: 1, limit: 20 });

      expect(result.messages).toHaveLength(1);
      expect(result.totalPages).toBe(1);
      expect(prismaMock.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { conversationId: 'cv1' }, skip: 0, take: 20 }),
      );
    });
  });
});
