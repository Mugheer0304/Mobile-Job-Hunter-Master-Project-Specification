import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

const postInclude = {
  author: { select: { id: true, fullName: true, profile: true } },
  likes: { select: { userId: true } },
  _count: { select: { likes: true, comments: true } },
} as const;

export async function listPosts(query: { authorId?: string; page: number; limit: number }) {
  const { authorId, page, limit } = query;
  const where = authorId ? { authorId } : {};

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      ...postInclude,
      comments: {
        include: { author: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!post) throw ApiError.notFound('Post not found');
  return post;
}

export async function createPost(authorId: string, data: { content: string; imageUrl?: string | null }) {
  return prisma.post.create({ data: { authorId, ...data } });
}

export async function updatePost(id: string, authorId: string, data: { content?: string }) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw ApiError.notFound('Post not found');
  if (post.authorId !== authorId) throw ApiError.forbidden('Not authorized');
  return prisma.post.update({ where: { id }, data });
}

export async function deletePost(id: string, authorId: string) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw ApiError.notFound('Post not found');
  if (post.authorId !== authorId) throw ApiError.forbidden('Not authorized');
  await prisma.post.delete({ where: { id } });
}

export async function toggleLike(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw ApiError.notFound('Post not found');

  const existing = await prisma.postLike.findUnique({ where: { postId_userId: { postId, userId } } });
  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    return { liked: false };
  }
  await prisma.postLike.create({ data: { postId, userId } });
  return { liked: true };
}

export async function addComment(postId: string, authorId: string, content: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw ApiError.notFound('Post not found');
  return prisma.comment.create({ data: { postId, authorId, content } });
}
