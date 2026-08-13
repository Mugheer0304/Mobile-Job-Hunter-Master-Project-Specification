'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Protected } from '@/components/Protected';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Textarea } from '@/components/Input';
import { Spinner } from '@/components/Spinner';
import type { Post } from '@/types';

export default function FeedPage() {
  return (
    <Protected>
      <Feed />
    </Protected>
  );
}

function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const load = useCallback(async () => {
    const res = await api.get<{ posts: Post[] }>('/posts');
    setPosts(res.posts);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  async function createPost(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    await api.post('/posts', { content });
    setContent('');
    await load();
  }

  async function toggleLike(id: string) {
    await api.post(`/posts/${id}/like`);
    await load();
  }

  async function addComment(id: string, e: FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    await api.post(`/posts/${id}/comments`, { content: commentText });
    setCommentText('');
    setCommenting(null);
    await load();
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Feed</h1>

      <Card className="mb-5">
        <form onSubmit={createPost} className="flex flex-col gap-3">
          <Textarea
            placeholder={`Share an update, ${user?.fullName?.split(' ')[0] ?? 'there'}…`}
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div>
            <Button type="submit" disabled={!content.trim()}>
              Post
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-4">
        {posts.length === 0 && <p className="text-center text-gray-400">No posts yet.</p>}
        {posts.map((post) => (
          <Card key={post.id}>
            <p className="font-medium">{post.author.fullName}</p>
            <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{post.content}</p>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <button onClick={() => toggleLike(post.id)} className="hover:text-brand">
                👍 {post._count.likes} Like
              </button>
              <button onClick={() => setCommenting(commenting === post.id ? null : post.id)}>
                💬 {post._count.comments} Comment
              </button>
            </div>
            {commenting === post.id && (
              <form onSubmit={(e) => addComment(post.id, e)} className="mt-3 flex gap-2">
                <Textarea
                  rows={2}
                  placeholder="Write a comment…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm" variant="secondary">
                  Send
                </Button>
              </form>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
