import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export async function listCompanies(query: { q?: string; page: number; limit: number }) {
  const { q, page, limit } = query;
  const where: Prisma.CompanyWhereInput = q
    ? { name: { contains: q, mode: 'insensitive' } }
    : {};

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: { _count: { select: { jobs: true } } },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.company.count({ where }),
  ]);

  return { companies, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getCompany(id: string) {
  const company = await prisma.company.findUnique({
    where: { id },
    include: { jobs: { where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } } },
  });
  if (!company) throw ApiError.notFound('Company not found');
  return company;
}

export async function createCompany(createdById: string, data: Prisma.CompanyUncheckedCreateInput) {
  return prisma.company.create({ data: { ...data, createdById } });
}

export async function updateCompany(id: string, data: Prisma.CompanyUpdateInput) {
  await prisma.company.findUniqueOrThrow({ where: { id } });
  return prisma.company.update({ where: { id }, data });
}

export async function deleteCompany(id: string) {
  await prisma.company.findUniqueOrThrow({ where: { id } });
  await prisma.company.delete({ where: { id } });
}
