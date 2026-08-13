// Seed script — run with `npm run db:seed` (or `npx prisma db seed`).
// Creates a demo admin + users + companies + jobs so the app is usable locally.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mjh.dev' },
    update: {},
    create: {
      email: 'admin@mjh.dev',
      passwordHash,
      fullName: 'MJH Admin',
      role: 'ADMIN',
      emailVerified: true,
      profile: { create: { headline: 'Platform administrator' } },
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@mjh.dev' },
    update: {},
    create: {
      email: 'alice@mjh.dev',
      passwordHash,
      fullName: 'Alice Johnson',
      emailVerified: true,
      profile: {
        create: {
          headline: 'Senior Frontend Engineer',
          summary: 'Building delightful web experiences with React & TypeScript.',
          location: 'San Francisco, CA',
          skills: { create: [{ name: 'React' }, { name: 'TypeScript' }, { name: 'Tailwind' }] },
        },
      },
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@mjh.dev' },
    update: {},
    create: {
      email: 'bob@mjh.dev',
      passwordHash,
      fullName: 'Bob Martinez',
      emailVerified: true,
      profile: {
        create: {
          headline: 'Backend Engineer (Node.js)',
          summary: 'APIs, databases and distributed systems.',
          location: 'Austin, TX',
          skills: { create: [{ name: 'Node.js' }, { name: 'PostgreSQL' }, { name: 'Docker' }] },
        },
      },
    },
  });

  const acme = await prisma.company.upsert({
    where: { id: 'acme-corp' },
    update: {},
    create: {
      id: 'acme-corp',
      name: 'Acme Corp',
      description: 'A fictional company that builds everything.',
      website: 'https://acme.example.com',
      industry: 'Technology',
      size: '1000-5000',
      foundedYear: 1999,
      createdById: admin.id,
    },
  });

  await prisma.job.upsert({
    where: { id: 'job-1' },
    update: {},
    create: {
      id: 'job-1',
      companyId: acme.id,
      title: 'Senior Frontend Engineer',
      description:
        'Own our customer-facing web app. React, TypeScript, Next.js. Remote friendly.',
      location: 'Remote',
      employmentType: 'FULL_TIME',
      experienceLevel: 'Senior',
      salaryMin: 130000,
      salaryMax: 170000,
      currency: 'USD',
      skills: ['React', 'TypeScript', 'Next.js'],
      status: 'OPEN',
      postedById: admin.id,
    },
  });

  await prisma.job.upsert({
    where: { id: 'job-2' },
    update: {},
    create: {
      id: 'job-2',
      companyId: acme.id,
      title: 'Backend Engineer',
      description:
        'Design and build APIs powering the platform. Node.js, PostgreSQL, Kubernetes.',
      location: 'Austin, TX',
      employmentType: 'FULL_TIME',
      experienceLevel: 'Mid',
      salaryMin: 110000,
      salaryMax: 150000,
      currency: 'USD',
      skills: ['Node.js', 'PostgreSQL', 'Docker'],
      status: 'OPEN',
      postedById: admin.id,
    },
  });

  // Sample connection between seeded users
  await prisma.connection.upsert({
    where: { requesterId_addresseeId: { requesterId: alice.id, addresseeId: bob.id } },
    update: {},
    create: { requesterId: alice.id, addresseeId: bob.id, status: 'ACCEPTED' },
  });

  console.log('✅ Seed complete.');
  console.log('   Admin:   admin@mjh.dev / Password123!');
  console.log('   User:    alice@mjh.dev / Password123!');
  console.log('   User:    bob@mjh.dev   / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
