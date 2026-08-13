import Link from 'next/link';
import type { Job } from '@/types';

function formatSalary(job: Job): string | null {
  if (job.salaryMin == null && job.salaryMax == null) return null;
  const fmt = (n?: number | null) =>
    n != null ? `${job.currency} ${n.toLocaleString()}` : null;
  const min = fmt(job.salaryMin);
  const max = fmt(job.salaryMax);
  if (min && max) return `${min} – ${max}`;
  return min ?? max;
}

export function JobCard({ job }: { job: Job }) {
  const salary = formatSalary(job);
  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-brand hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-brand group-hover:underline">
              {job.title}
            </h3>
            <p className="text-sm text-gray-600">{job.company.name}</p>
          </div>
          {salary && <p className="shrink-0 text-sm font-medium text-gray-700">{salary}</p>}
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-gray-600">{job.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {job.location && <span>📍 {job.location}</span>}
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-brand">
            {job.employmentType.replace('_', ' ')}
          </span>
          {job.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5">
              {s}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
