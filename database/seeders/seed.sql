-- =====================================================================
-- Mobile Job Hunter — sample seed data (reference)
-- NOTE: The runnable seeder is backend/prisma/seed.ts (npm run db:seed).
-- This SQL mirrors it for teams that prefer raw SQL.
-- Passwords below are bcrypt hashes of "Password123!".
-- =====================================================================

INSERT INTO users (id, email, "passwordHash", "fullName", role, "emailVerified") VALUES
  ('admin', 'admin@mjh.dev', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'MJH Admin', 'ADMIN', true),
  ('alice', 'alice@mjh.dev', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Alice Johnson', 'USER', true),
  ('bob',   'bob@mjh.dev',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Bob Martinez', 'USER', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, "userId", headline, summary, location) VALUES
  ('p-admin', 'admin', 'Platform administrator', NULL, NULL),
  ('p-alice', 'alice', 'Senior Frontend Engineer', 'Building delightful web experiences with React & TypeScript.', 'San Francisco, CA'),
  ('p-bob',   'bob',   'Backend Engineer (Node.js)', 'APIs, databases and distributed systems.', 'Austin, TX')
ON CONFLICT (id) DO NOTHING;

INSERT INTO skills (id, "profileId", name) VALUES
  ('s1', 'p-alice', 'React'), ('s2', 'p-alice', 'TypeScript'), ('s3', 'p-alice', 'Tailwind'),
  ('s4', 'p-bob', 'Node.js'), ('s5', 'p-bob', 'PostgreSQL'), ('s6', 'p-bob', 'Docker')
ON CONFLICT (id) DO NOTHING;

INSERT INTO companies (id, name, description, website, industry, size, "foundedYear", "createdById") VALUES
  ('acme-corp', 'Acme Corp', 'A fictional company that builds everything.', 'https://acme.example.com', 'Technology', '1000-5000', 1999, 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO jobs (id, "companyId", title, description, location, "employmentType", "experienceLevel", "salaryMin", "salaryMax", currency, skills, status, "postedById") VALUES
  ('job-1', 'acme-corp', 'Senior Frontend Engineer', 'Own our customer-facing web app. React, TypeScript, Next.js. Remote friendly.', 'Remote', 'FULL_TIME', 'Senior', 130000, 170000, 'USD', ARRAY['React','TypeScript','Next.js'], 'OPEN', 'admin'),
  ('job-2', 'acme-corp', 'Backend Engineer', 'Design and build APIs powering the platform. Node.js, PostgreSQL, Kubernetes.', 'Austin, TX', 'FULL_TIME', 'Mid', 110000, 150000, 'USD', ARRAY['Node.js','PostgreSQL','Docker'], 'OPEN', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO connections (id, "requesterId", "addresseeId", status) VALUES
  ('conn-1', 'alice', 'bob', 'ACCEPTED')
ON CONFLICT (id) DO NOTHING;
