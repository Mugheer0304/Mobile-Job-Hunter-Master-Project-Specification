'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import type { Job } from '@/types';

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Job>(`/jobs/${params.id}`)
      .then(setJob)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load job'))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function apply() {
    setApplying(true);
    setNotice(null);
    try {
      await api.post('/applications', { jobId: job!.id });
      setNotice('Application submitted successfully 🎉');
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : 'Failed to apply');
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <Spinner />;
  if (error || !job) {
    return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error ?? 'Job not found'}</p>;
  }

  const salary =
    job.salaryMin != null || job.salaryMax != null
      ? `${job.currency} ${job.salaryMin?.toLocaleString() ?? '—'} – ${job.salaryMax?.toLocaleString() ?? '—'}`
      : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/jobs" className="text-sm text-brand hover:underline">
        ← Back to jobs
      </Link>

      <Card className="mt-4">
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <p className="mt-1 text-gray-600">{job.company.name}</p>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {job.location && <span>📍 {job.location}</span>}
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-brand">
            {job.employmentType.replace('_', ' ')}
          </span>
          {job.experienceLevel && <span>{job.experienceLevel}</span>}
          {salary && <span className="font-medium">💵 {salary}</span>}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {job.skills.map((s) => (
            <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-700">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-gray-700">
          {job.description}
        </div>

        <div className="mt-6 border-t border-gray-100 pt-5">
          {notice && (
            <p className="mb-3 rounded-lg bg-gray-100 p-3 text-sm text-gray-700">{notice}</p>
          )}
          {user ? (
            <Button onClick={apply} disabled={applying || job.status !== 'OPEN'}>
              {applying ? 'Submitting…' : job.status === 'OPEN' ? 'Apply now' : 'Closed'}
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="secondary">Sign in to apply</Button>
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}
