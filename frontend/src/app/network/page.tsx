'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Protected } from '@/components/Protected';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Spinner } from '@/components/Spinner';

interface Person {
  id: string;
  fullName: string;
  profile?: { headline?: string | null };
}

interface Conn {
  id: string;
  status: string;
  requester: Person;
  addressee: Person;
}

export default function NetworkPage() {
  return (
    <Protected>
      <Network />
    </Protected>
  );
}

function Network() {
  const [connections, setConnections] = useState<Conn[]>([]);
  const [pending, setPending] = useState<Conn[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [conns, pend] = await Promise.all([
      api.get<{ connections: Conn[] }>('/connections'),
      api.get<Conn[]>('/connections/pending'),
    ]);
    setConnections(conns.connections);
    setPending(pend);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  async function sendRequest(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    try {
      await api.post('/connections', { addresseeId: userId });
      setUserId('');
      setNotice('Connection request sent ✅');
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to send request');
    }
  }

  async function respond(id: string, status: 'ACCEPTED' | 'REJECTED') {
    await api.patch(`/connections/${id}`, { status });
    await load();
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">My Network</h1>

      <Card className="mb-5">
        <h2 className="mb-3 text-lg font-semibold">Connect with someone</h2>
        <form onSubmit={sendRequest} className="flex gap-2">
          <Input
            placeholder="User ID to connect with"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Send request</Button>
        </form>
        {notice && <p className="mt-2 text-sm text-gray-600">{notice}</p>}
      </Card>

      {pending.length > 0 && (
        <Card className="mb-5">
          <h2 className="mb-3 text-lg font-semibold">Pending requests</h2>
          <ul className="flex flex-col gap-3">
            {pending.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.requester.fullName}</p>
                  <p className="text-sm text-gray-500">{c.requester.profile?.headline}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => respond(c.id, 'ACCEPTED')}>
                    Accept
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => respond(c.id, 'REJECTED')}>
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-lg font-semibold">
          Connections ({connections.filter((c) => c.status === 'ACCEPTED').length})
        </h2>
        {connections.filter((c) => c.status === 'ACCEPTED').length === 0 ? (
          <p className="text-sm text-gray-400">No connections yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {connections
              .filter((c) => c.status === 'ACCEPTED')
              .map((c) => {
                const other = c.requester.id === c.addressee.id ? c.requester : c.requester;
                return (
                  <li key={c.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <p className="font-medium">{other.fullName}</p>
                    <p className="text-sm text-gray-500">{other.profile?.headline}</p>
                  </li>
                );
              })}
          </ul>
        )}
      </Card>
    </div>
  );
}
