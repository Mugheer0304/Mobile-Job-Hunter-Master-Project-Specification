// Mirrors the backend API response shapes (see backend/src/services).

export type Role = 'USER' | 'ADMIN';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'REMOTE';
export type JobStatus = 'OPEN' | 'CLOSED' | 'DRAFT';
export type ApplicationStatus =
  | 'APPLIED'
  | 'REVIEWING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';
export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  current: boolean;
  description?: string | null;
}

export interface Education {
  id: string;
  school: string;
  degree?: string | null;
  field?: string | null;
  startDate: string;
  endDate?: string | null;
}

export interface Profile {
  id: string;
  userId: string;
  headline?: string | null;
  summary?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  resumeUrl?: string | null;
  website?: string | null;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
}

export interface Company {
  id: string;
  name: string;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  industry?: string | null;
  size?: string | null;
  foundedYear?: number | null;
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  location?: string | null;
  employmentType: EmploymentType;
  experienceLevel?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency: string;
  skills: string[];
  status: JobStatus;
  createdAt: string;
  company: Pick<Company, 'id' | 'name' | 'logoUrl'>;
  _count?: { applications: number };
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  coverLetter?: string | null;
  resumeUrl?: string | null;
  status: ApplicationStatus;
  createdAt: string;
  job?: Job;
}

export interface Connection {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: ConnectionStatus;
  requester?: { id: string; fullName: string };
  addressee?: { id: string; fullName: string };
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  author: { id: string; fullName: string };
  _count: { likes: number; comments: number };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}
