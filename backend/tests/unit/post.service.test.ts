import { prisma } from '../../src/config/prisma';
import {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
} from '../../src/services/post.service';

jest.mock('../../src/config/prisma', () => ({
  prisma: {
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    postLike: { findUnique: jest.fn(), delete: jest.fn(), create: jest.fn() },
    comment: { create: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  post: {
    findMany: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  postLike: { findUnique: jest.Mock; delete: jest.Mock; create: jest.Mock };
  comment: { create: jest.Mock };
};

const post = {
  id: 'p1',
  authorId: 'u1',
  content: 'Hello world',
  createdAt: new Date('2024-01-01'),
};

describe('post.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listPosts', () => {
    it('returns paginated posts', async () => {
      prismaMock.post.findMany.mockResolvedValue([post]);
      prismaMock.post.count.mockResolvedValue(1);

      const result = await listPosts({ page: 1, limit: 20 });

      expect(result.posts).toHaveLength(1);
      expect(result.totalPages).toBe(1);
      expect(prismaMock.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, orderBy: { createdAt: 'desc' }, skip: 0, take: 20 }),
      );
    });

    it('filters by author when provided', async () => {
      prismaMock.post.findMany.mockResolvedValue([]);
      prismaMock.post.count.mockResolvedValue(0);

      await listPosts({ authorId: 'u1', page: 1, limit: 20 });

      const where = prismaMock.post.findMany.mock.calls[0][0].where;
      expect(where).toEqual({ authorId: 'u1' });
    });
  });

  describe('getPost', () => {
    it('returns the post with comments when found', async () => {
      prismaMock.post.findUnique.mockResolvedValue({ ...post, comments: [] });

      const result = await getPost('p1');

      expect(result.id).toBe('p1');
      expect(result.comments).toEqual([]);
    });

    it('throws notFound when missing', async () => {
      prismaMock.post.findUnique.mockResolvedValue(null);

      await expect(getPost('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('createPost', () => {
    it('creates the post', async () => {
      prismaMock.post.create.mockResolvedValue(post);

      const result = await createPost('u1', { content: 'Hello world' });

      expect(result.id).toBe('p1');
      expect(prismaMock.post.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { authorId: 'u1', content: 'Hello world' } }),
      );
    });
  });

  describe('updatePost', () => {
    it('throws notFound when the post does not exist', async () => {
      prismaMock.post.findUnique.mockResolvedValue(null);

      await expect(updatePost('p1', 'u1', { content: 'x' })).rejects.toMatchObject({ statusCode: 404 });
    });

    it('forbids a non-author from updating', async () => {
      prismaMock.post.findUnique.mockResolvedValue(post);

      await expect(updatePost('p1', 'u2', { content: 'x' })).rejects.toMatchObject({ statusCode: 403 });
    });

    it('updates the post as the author', async () => {
      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.post.update.mockResolvedValue({ ...post, content: 'Updated' });

      const result = await updatePost('p1', 'u1', { content: 'Updated' });

      expect(result.content).toBe('Updated');
      expect(prismaMock.post.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { content: 'Updated' } });
    });
  });

  describe('deletePost', () => {
    it('forbids a non-author from deleting', async () => {
      prismaMock.post.findUnique.mockResolvedValue(post);

      await expect(deletePost('p1', 'u2')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('deletes the post as the author', async () => {
      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.post.delete.mockResolvedValue(post);

      await deletePost('p1', 'u1');

      expect(prismaMock.post.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });
  });

  describe('toggleLike', () => {
    it('throws notFound when the post does not exist', async () => {
      prismaMock.post.findUnique.mockResolvedValue(null);

      await expect(toggleLike('p1', 'u2')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('unlikes when the user already liked', async () => {
      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.postLike.findUnique.mockResolvedValue({ id: 'l1', postId: 'p1', userId: 'u2' });
      prismaMock.postLike.delete.mockResolvedValue({ id: 'l1' });

      const result = await toggleLike('p1', 'u2');

      expect(result).toEqual({ liked: false });
      expect(prismaMock.postLike.delete).toHaveBeenCalled();
    });

    it('likes when the user had not liked', async () => {
      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.postLike.findUnique.mockResolvedValue(null);
      prismaMock.postLike.create.mockResolvedValue({ id: 'l1' });

      const result = await toggleLike('p1', 'u2');

      expect(result).toEqual({ liked: true });
      expect(prismaMock.postLike.create).toHaveBeenCalledWith({ data: { postId: 'p1', userId: 'u2' } });
    });
  });

  describe('addComment', () => {
    it('throws notFound when the post does not exist', async () => {
      prismaMock.post.findUnique.mockResolvedValue(null);

      await expect(addComment('p1', 'u2', 'Nice!')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('creates the comment', async () => {
      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.comment.create.mockResolvedValue({ id: 'c1', postId: 'p1', authorId: 'u2', content: 'Nice!' });

      const result = await addComment('p1', 'u2', 'Nice!');

      expect(result.id).toBe('c1');
      expect(prismaMock.comment.create).toHaveBeenCalledWith({
        data: { postId: 'p1', authorId: 'u2', content: 'Nice!' },
      });
    });
  });
});
