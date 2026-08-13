'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to continue to Mobile Job Hunter</p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-brand hover:underline">
            Join now
          </Link>
        </p>
      </Card>

      <p className="mt-4 rounded-lg bg-gray-100 p-3 text-center text-xs text-gray-500">
        Demo accounts: <span className="font-medium">alice@mjh.dev</span> / Password123!
      </p>
    </div>
  );
}
