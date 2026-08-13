-- =====================================================================
-- Mobile Job Hunter — reference SQL DDL (PostgreSQL)
-- NOTE: The authoritative data model is backend/prisma/schema.prisma.
-- Migrations are generated via `npx prisma migrate dev`. This file is a
-- human-readable reference kept in sync with that schema.
-- =====================================================================

CREATE TYPE "Role"              AS ENUM ('USER', 'ADMIN');
CREATE TYPE "EmploymentType"    AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE');
CREATE TYPE "JobStatus"         AS ENUM ('OPEN', 'CLOSED', 'DRAFT');
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'REVIEWING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "ConnectionStatus"  AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "fullName"    TEXT NOT NULL,
  role          "Role" NOT NULL DEFAULT 'USER',
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id        TEXT PRIMARY KEY,
  "userId"  TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  headline  TEXT,
  summary   TEXT,
  location  TEXT,
  "avatarUrl" TEXT,
  "resumeUrl" TEXT,
  website   TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE experiences (
  id         TEXT PRIMARY KEY,
  "profileId" TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  company    TEXT NOT NULL,
  location   TEXT,
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate"  TIMESTAMPTZ,
  current    BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE educations (
  id         TEXT PRIMARY KEY,
  "profileId" TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school     TEXT NOT NULL,
  degree     TEXT,
  field      TEXT,
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate"  TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE skills (
  id         TEXT PRIMARY KEY,
  "profileId" TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  UNIQUE ("profileId", name)
);

CREATE TABLE companies (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  website     TEXT,
  "logoUrl"   TEXT,
  industry    TEXT,
  size        TEXT,
  "foundedYear" INTEGER,
  "createdById" TEXT NOT NULL REFERENCES users(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE jobs (
  id             TEXT PRIMARY KEY,
  "companyId"    TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  location       TEXT,
  "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
  "experienceLevel" TEXT,
  "salaryMin"    INTEGER,
  "salaryMax"    INTEGER,
  currency       TEXT NOT NULL DEFAULT 'USD',
  skills         TEXT[] NOT NULL DEFAULT '{}',
  status         "JobStatus" NOT NULL DEFAULT 'OPEN',
  "postedById"   TEXT NOT NULL REFERENCES users(id),
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX jobs_title_idx ON jobs (title);
CREATE INDEX jobs_status_idx ON jobs (status);
CREATE INDEX jobs_company_idx ON jobs ("companyId");

CREATE TABLE applications (
  id          TEXT PRIMARY KEY,
  "jobId"     TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  "userId"    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "coverLetter" TEXT,
  "resumeUrl" TEXT,
  status      "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("jobId", "userId")
);
CREATE INDEX applications_user_idx ON applications ("userId");

CREATE TABLE connections (
  id           TEXT PRIMARY KEY,
  "requesterId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "addresseeId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("requesterId", "addresseeId")
);
CREATE INDEX connections_addressee_idx ON connections ("addresseeId");

CREATE TABLE posts (
  id         TEXT PRIMARY KEY,
  "authorId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX posts_author_idx ON posts ("authorId");

CREATE TABLE post_likes (
  id         TEXT PRIMARY KEY,
  "postId"   TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "userId"   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("postId", "userId")
);

CREATE TABLE comments (
  id         TEXT PRIMARY KEY,
  "postId"   TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "authorId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversations (
  id         TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversation_participants (
  id              TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  "userId"        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE ("conversationId", "userId")
);

CREATE TABLE messages (
  id              TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  "senderId"      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  "readAt"        TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_conversation_idx ON messages ("conversationId");

CREATE TABLE notifications (
  id         TEXT PRIMARY KEY,
  "userId"   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  "readAt"   TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications ("userId", "readAt");

CREATE TABLE refresh_tokens (
  id         TEXT PRIMARY KEY,
  "userId"   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "revokedAt" TIMESTAMPTZ,
  "userAgent" TEXT,
  ip         TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_user_idx ON refresh_tokens ("userId");
