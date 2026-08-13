import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export async function listUsers(query: { page: number; limit: number }) {
  const { page, limit } = query;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count(),
  ]);
  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function setUserActive(id: string, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User not found');
  return prisma.user.update({ where: { id }, data: { isActive } });
}

export async function setUserRole(id: string, role: 'USER' | 'ADMIN') {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User not found');
  return prisma.user.update({ where: { id }, data: { role } });
}

export async function deleteUser(id: string) {
  await prisma.user.findUniqueOrThrow({ where: { id } });
  await prisma.user.delete({ where: { id } });
}

export async function stats() {
  const [users, jobs, applications, companies, posts] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.company.count(),
    prisma.post.count(),
  ]);
  return { users, jobs, applications, companies, posts };
}
