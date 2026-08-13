'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Protected } from '@/components/Protected';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  return (
    <Protected>
      <Notifications />
    </Protected>
  );
}

function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await api.get<{ notifications: Notification[]; unreadCount: number }>(
      '/notifications',
    );
    setItems(res.notifications);
    setUnread(res.unreadCount);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  async function markAllRead() {
    await api.post('/notifications/read', { all: true });
    await load();
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications ({unread} unread)</h1>
        <Button variant="secondary" size="sm" onClick={markAllRead} disabled={unread === 0}>
          Mark all read
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {items.length === 0 && <p className="text-center text-gray-400">No notifications.</p>}
        {items.map((n) => (
          <Card key={n.id} className={n.readAt ? '' : 'border-brand bg-brand-light/40'}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{n.title}</p>
                {n.body && <p className="mt-1 text-sm text-gray-600">{n.body}</p>}
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
