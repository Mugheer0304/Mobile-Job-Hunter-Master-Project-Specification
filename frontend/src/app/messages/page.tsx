'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Protected } from '@/components/Protected';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Spinner } from '@/components/Spinner';

interface Conversation {
  id: string;
  participants: { user: { id: string; fullName: string } }[];
  messages: { content: string; createdAt: string; senderId: string }[];
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export default function MessagesPage() {
  return (
    <Protected>
      <Messages />
    </Protected>
  );
}

function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newUserId, setNewUserId] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    const res = await api.get<Conversation[]>('/messages/conversations');
    setConversations(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConversations().catch(() => setLoading(false));
  }, [loadConversations]);

  async function openConversation(id: string) {
    setActiveId(id);
    const res = await api.get<{ messages: Message[] }>(`/messages/conversations/${id}/messages`);
    setMessages(res.messages.slice().reverse());
  }

  async function startConversation(e: FormEvent) {
    e.preventDefault();
    const conv = await api.post<Conversation>('/messages/conversations', { userId: newUserId });
    setNewUserId('');
    await loadConversations();
    await openConversation(conv.id);
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!activeId || !content.trim()) return;
    await api.post('/messages/messages', { conversationId: activeId, content });
    setContent('');
    await openConversation(activeId);
  }

  if (loading) return <Spinner />;

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Messages</h1>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Card>
            <h2 className="mb-3 text-lg font-semibold">Conversations</h2>
            <form onSubmit={startConversation} className="mb-3 flex gap-2">
              <Input
                placeholder="User ID"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" variant="secondary">
                New
              </Button>
            </form>
            {conversations.length === 0 && <p className="text-sm text-gray-400">No conversations.</p>}
            <ul className="flex flex-col gap-2">
              {conversations.map((c) => {
                const other = c.participants.find((p) => p.user.id !== user?.id)?.user;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => openConversation(c.id)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                        activeId === c.id ? 'bg-brand-light' : ''
                      }`}
                    >
                      {other?.fullName ?? 'Conversation'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="flex h-96 flex-col">
            {active ? (
              <>
                <div className="flex-1 overflow-y-auto">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`mb-2 max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        m.senderId === user?.id
                          ? 'ml-auto bg-brand text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {m.content}
                    </div>
                  ))}
                </div>
                <form onSubmit={sendMessage} className="mt-3 flex gap-2">
                  <Input
                    placeholder="Type a message…"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit">Send</Button>
                </form>
              </>
            ) : (
              <p className="m-auto text-sm text-gray-400">Select a conversation to start messaging.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
