import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export async function apply(userId: string, data: { jobId: string; coverLetter?: string | null; resumeUrl?: string | null }) {
  const job = await prisma.job.findUnique({ where: { id: data.jobId } });
  if (!job) throw ApiError.notFound('Job not found');
  if (job.status !== 'OPEN') throw ApiError.badRequest('This job is no longer accepting applications');

  const existing = await prisma.application.findUnique({
    where: { jobId_userId: { jobId: data.jobId, userId } },
  });
  if (existing) throw ApiError.conflict('You have already applied to this job');

  return prisma.application.create({
    data: { jobId: data.jobId, userId, coverLetter: data.coverLetter, resumeUrl: data.resumeUrl },
  });
}

export async function listMyApplications(
  userId: string,
  query: { status?: string; page: number; limit: number },
) {
  const { status, page, limit } = query;
  const where = { userId, ...(status ? { status: status as ApplicationStatus } : {}) };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        job: { include: { company: { select: { id: true, name: true, logoUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.application.count({ where }),
  ]);

  return { applications, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function listJobApplications(
  jobId: string,
  requesterId: string,
  query: { status?: string; page: number; limit: number },
) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw ApiError.notFound('Job not found');
  // Only the job poster or an admin may view the applicant list.
  if (job.postedById !== requesterId) throw ApiError.forbidden('Not authorized to view applicants');

  const { status, page, limit } = query;
  const where = { jobId, ...(status ? { status: status as ApplicationStatus } : {}) };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, email: true, profile: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.application.count({ where }),
  ]);

  return { applications, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateApplicationStatus(
  applicationId: string,
  requesterId: string,
  status: ApplicationStatus,
) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });
  if (!application) throw ApiError.notFound('Application not found');
  if (application.job.postedById !== requesterId && application.userId !== requesterId) {
    throw ApiError.forbidden('Not authorized to update this application');
  }
  // Applicants may only withdraw their own application.
  if (application.userId === requesterId && status !== 'WITHDRAWN') {
    throw ApiError.forbidden('Applicants can only withdraw their application');
  }
  return prisma.application.update({ where: { id: applicationId }, data: { status } });
}
