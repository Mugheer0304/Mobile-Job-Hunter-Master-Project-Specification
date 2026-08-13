'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Protected } from '@/components/Protected';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

interface Stats {
  users: number;
  jobs: number;
  applications: number;
  companies: number;
  posts: number;
}

export default function AdminPage() {
  return (
    <Protected>
      <Admin />
    </Protected>
  );
}

function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [s, u] = await Promise.all([
      api.get<Stats>('/admin/stats'),
      api.get<{ users: AdminUser[] }>('/admin/users'),
    ]);
    setStats(s);
    setUsers(u.users);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  if (loading) return <Spinner />;

  if (user?.role !== 'ADMIN') {
    return <p className="text-center text-gray-500">Admin access required.</p>;
  }

  async function toggleActive(u: AdminUser) {
    await api.patch(`/admin/users/${u.id}/active`, { isActive: !u.isActive });
    await load();
  }

  async function toggleRole(u: AdminUser) {
    await api.patch(`/admin/users/${u.id}/role`, {
      role: u.role === 'ADMIN' ? 'USER' : 'ADMIN',
    });
    await load();
  }

  async function removeUser(u: AdminUser) {
    if (!confirm(`Delete ${u.email}?`)) return;
    await api.delete(`/admin/users/${u.id}`);
    await load();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Admin</h1>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Object.entries(stats).map(([k, v]) => (
            <Card key={k} className="text-center">
              <p className="text-2xl font-bold text-brand">{v}</p>
              <p className="text-xs uppercase tracking-wide text-gray-500">{k}</p>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2">{u.fullName}</td>
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{u.role}</td>
                  <td className="py-2">
                    <span className={u.isActive ? 'text-green-600' : 'text-red-600'}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => toggleRole(u)}>
                        {u.role === 'ADMIN' ? 'Make user' : 'Make admin'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(u)}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => removeUser(u)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
