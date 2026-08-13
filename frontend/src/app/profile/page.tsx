'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Protected } from '@/components/Protected';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input, Textarea } from '@/components/Input';
import { Spinner } from '@/components/Spinner';
import type { Profile, SafeUser } from '@/types';

type Me = SafeUser & { profile: Profile };

export default function ProfilePage() {
  return (
    <Protected>
      <ProfileEditor />
    </Protected>
  );
}

function ProfileEditor() {
  const { user } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [location, setLocation] = useState('');
  const [newSkill, setNewSkill] = useState('');

  const load = useCallback(async () => {
    const data = await api.get<Me>('/auth/me');
    setMe(data);
    setHeadline(data.profile.headline ?? '');
    setSummary(data.profile.summary ?? '');
    setLocation(data.profile.location ?? '');
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const updated = await api.put<Me>('/users/me/profile', { headline, summary, location });
      setMe(updated);
      setNotice('Profile saved ✅');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function addSkill(e: FormEvent) {
    e.preventDefault();
    if (!newSkill.trim()) return;
    try {
      const updated = await api.post<Me>('/users/me/skills', { name: newSkill.trim() });
      setMe(updated);
      setNewSkill('');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to add skill');
    }
  }

  async function removeSkill(name: string) {
    try {
      const updated = await api.delete<Me>(`/users/me/skills/${encodeURIComponent(name)}`);
      setMe(updated);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to remove skill');
    }
  }

  if (loading || !me) return <Spinner />;

  const profile = me.profile;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{user?.fullName}</h1>
        <p className="text-sm text-gray-500">{me.email}</p>
      </div>

      <div className="flex flex-col gap-5">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Edit profile</h2>
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <Input label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
            <Textarea
              label="Summary"
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
            <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            {notice && <p className="text-sm text-gray-600">{notice}</p>}
            <div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Skills</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {profile.skills.length === 0 && <p className="text-sm text-gray-400">No skills yet.</p>}
            {profile.skills.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-full bg-brand-light px-3 py-1 text-sm text-brand"
              >
                {s.name}
                <button
                  onClick={() => removeSkill(s.name)}
                  className="text-brand-dark hover:opacity-70"
                  aria-label={`Remove ${s.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={addSkill} className="flex gap-2">
            <Input
              placeholder="Add a skill (e.g. React)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary">
              Add
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Experience</h2>
          {profile.experiences.length === 0 ? (
            <p className="text-sm text-gray-400">No experience added yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {profile.experiences.map((exp) => (
                <li key={exp.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <p className="font-medium">{exp.title}</p>
                  <p className="text-sm text-gray-600">
                    {exp.company}
                    {exp.location ? ` · ${exp.location}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
