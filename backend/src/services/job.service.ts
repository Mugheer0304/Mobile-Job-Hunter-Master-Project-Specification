import { Prisma, JobStatus, EmploymentType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export interface JobQuery {
  q?: string;
  location?: string;
  employmentType?: string;
  status?: string;
  companyId?: string;
  sortBy?: 'createdAt' | 'salaryMin' | 'title';
  order?: 'asc' | 'desc';
  page: number;
  limit: number;
}

export async function listJobs(query: JobQuery) {
  const { q, location, employmentType, status, companyId, sortBy, order, page, limit } = query;

  const where: Prisma.JobWhereInput = {
    ...(status ? { status: status as JobStatus } : { status: 'OPEN' }),
    ...(companyId ? { companyId } : {}),
    ...(employmentType ? { employmentType: employmentType as EmploymentType } : {}),
    ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { skills: { has: q } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.JobOrderByWithRelationInput =
    sortBy === 'salaryMin'
      ? { salaryMin: order ?? 'desc' }
      : sortBy === 'title'
        ? { title: order ?? 'desc' }
        : { createdAt: order ?? 'desc' };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { company: { select: { id: true, name: true, logoUrl: true } } },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  return { jobs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getJobById(id: string) {
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      company: true,
      postedBy: { select: { id: true, fullName: true } },
      _count: { select: { applications: true } },
    },
  });
  if (!job) throw ApiError.notFound('Job not found');
  return job;
}

export async function createJob(data: Prisma.JobUncheckedCreateInput) {
  return prisma.job.create({ data });
}

export async function updateJob(id: string, data: Prisma.JobUpdateInput) {
  await prisma.job.findUniqueOrThrow({ where: { id } });
  return prisma.job.update({ where: { id }, data });
}

export async function deleteJob(id: string) {
  await prisma.job.findUniqueOrThrow({ where: { id } });
  await prisma.job.delete({ where: { id } });
}
