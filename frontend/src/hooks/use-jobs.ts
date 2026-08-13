'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Job, Paginated } from '@/types';

export interface JobFilters {
  q?: string;
  location?: string;
  employmentType?: string;
  page?: number;
}

export function useJobs(initialFilters: JobFilters = {}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobFilters>(initialFilters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.location) params.set('location', filters.location);
      if (filters.employmentType) params.set('employmentType', filters.employmentType);
      params.set('page', String(filters.page ?? 1));

      const res = await api.get<Paginated<Job> & { jobs: Job[] }>(`/jobs?${params.toString()}`);
      setJobs(res.jobs);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  return { jobs, total, loading, error, filters, setFilters, reload: load };
}
