'use client';

import { FormEvent, useState } from 'react';
import { useJobs } from '@/hooks/use-jobs';
import { JobCard } from '@/components/JobCard';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE'];

export default function JobsPage() {
  const { jobs, total, loading, error, filters, setFilters } = useJobs();
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFilters({ ...filters, q: q || undefined, location: location || undefined, page: 1 });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Find your next role</h1>
        <p className="text-sm text-gray-500">{total} open position{total === 1 ? '' : 's'}</p>
      </div>

      <form onSubmit={onSubmit} className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search job title, keyword, skill…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="sm:w-48"
        />
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          value={filters.employmentType ?? ''}
          onChange={(e) =>
            setFilters({ ...filters, employmentType: e.target.value || undefined, page: 1 })
          }
        >
          <option value="">All types</option>
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace('_', ' ')}
            </option>
          ))}
        </select>
        <Button type="submit">Search</Button>
      </form>

      {loading ? (
        <Spinner label="Loading jobs…" />
      ) : error ? (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</p>
      ) : jobs.length === 0 ? (
        <p className="rounded-lg bg-gray-100 p-8 text-center text-gray-500">
          No jobs match your search.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            disabled={(filters.page ?? 1) <= 1}
            onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {filters.page ?? 1}
          </span>
          <Button
            variant="secondary"
            onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) + 1 })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
