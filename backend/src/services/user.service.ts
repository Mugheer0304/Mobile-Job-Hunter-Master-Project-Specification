import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { toSafeUser } from './auth.service';

const profileInclude = {
  experiences: true,
  educations: true,
  skills: true,
} as const;

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: { include: profileInclude } },
  });
  if (!user) throw ApiError.notFound('User not found');
  return { ...toSafeUser(user), profile: user.profile };
}

export async function getProfileByUserId(userId: string) {
  return getUserById(userId);
}

export async function updateProfile(userId: string, data: any) {
  await prisma.profile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
  return getProfileByUserId(userId);
}

export async function updateMe(userId: string, data: { fullName?: string }) {
  await prisma.user.update({ where: { id: userId }, data });
  return getUserById(userId);
}

export async function addExperience(userId: string, data: Prisma.ExperienceUncheckedCreateInput) {
  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  await prisma.experience.create({ data: { ...data, profileId: profile.id } });
  return getProfileByUserId(userId);
}

export async function removeExperience(userId: string, id: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) throw ApiError.notFound('Profile not found');
  await prisma.experience.deleteMany({ where: { id, profileId: profile.id } });
}

export async function addEducation(userId: string, data: Prisma.EducationUncheckedCreateInput) {
  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  await prisma.education.create({ data: { ...data, profileId: profile.id } });
  return getProfileByUserId(userId);
}

export async function removeEducation(userId: string, id: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) throw ApiError.notFound('Profile not found');
  await prisma.education.deleteMany({ where: { id, profileId: profile.id } });
}

export async function addSkill(userId: string, name: string) {
  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  await prisma.skill.upsert({
    where: { profileId_name: { profileId: profile.id, name } },
    update: {},
    create: { profileId: profile.id, name },
  });
  return getProfileByUserId(userId);
}

export async function removeSkill(userId: string, name: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) throw ApiError.notFound('Profile not found');
  await prisma.skill.deleteMany({ where: { profileId: profile.id, name } });
}
