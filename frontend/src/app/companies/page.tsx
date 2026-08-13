'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input, Textarea } from '@/components/Input';
import { Spinner } from '@/components/Spinner';
import type { Company } from '@/types';

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');

  const load = useCallback(async () => {
    const res = await api.get<{ companies: Company[] }>('/companies');
    setCompanies(res.companies);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  async function createCompany(e: FormEvent) {
    e.preventDefault();
    await api.post('/companies', { name, description, website });
    setName('');
    setDescription('');
    setWebsite('');
    await load();
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Companies</h1>

      {user && (
        <Card className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Create a company page</h2>
          <form onSubmit={createCompany} className="flex flex-col gap-3">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Textarea
              label="Description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label="Website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <div>
              <Button type="submit" disabled={!name.trim()}>
                Create company
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {companies.length === 0 && <p className="text-gray-400">No companies yet.</p>}
        {companies.map((c) => (
          <Card key={c.id}>
            <h3 className="font-semibold">{c.name}</h3>
            {c.industry && <p className="text-sm text-gray-500">{c.industry}</p>}
            {c.description && (
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">{c.description}</p>
            )}
            {c.website && (
              <a
                href={c.website}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-brand hover:underline"
              >
                {c.website}
              </a>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
