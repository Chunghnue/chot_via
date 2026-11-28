'use client';

import { useAddCommentMutation, useGetCommentsQuery, useGetPostQuery } from '@xin-via/api-client';
import { Avatar, Button, Card, EmptyState, Skeleton, Textarea, useFormatters } from '@xin-via/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { PostCard } from '@/components/post/post-card';
import { useWishSettings } from '@/features/wish/use-deity-wish';
import { track } from '@/lib/analytics';
import { useApiToast } from '@/lib/use-api-toast';
import { useRequireMember } from '@/lib/use-member';

function CommentPage({ postId, page }: { postId: string; page: number }) {
  const f = useFormatters();
  const { data } = useGetCommentsQuery({ postId, page });
  return (
    <>
      {data?.items.map((c) => (
        <li key={c.id} className="flex gap-3">
          <Link href={`/u/${c.author.id}`}><Avatar src={c.author.avatarUrl} name={c.author.displayName} size={36} /></Link>
          <div className="min-w-0 flex-1 rounded-2xl bg-surface-muted px-3 py-2">
            <p className="text-sm font-bold text-ink">{c.author.displayName} <span className="text-xs font-normal text-ink-subtle">{f.relative(c.createdAt)}</span></p>
            <p className="whitespace-pre-wrap break-words text-sm text-ink">{c.body}</p>
          </div>
        </li>
      ))}
    </>
  );
}

/** Chi tiết bài viết (đường dẫn của nút Chia sẻ) + bình luận (cần đăng nhập khi gửi). */
export default function PostPage() {
  const t = useTranslations('post');
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading, isError } = useGetPostQuery(id);
  const settings = useWishSettings();
  const [add, { isLoading: sending }] = useAddCommentMutation();
  const toast = useApiToast();
  const { require } = useRequireMember();
  const [text, setText] = useState('');
  const [pages, setPages] = useState(1);

  if (isLoading) return <Skeleton className="h-72" />;
  if (isError || !post) return <EmptyState icon="🔎" title={t('notFound')} />;

  const send = async (): Promise<void> => {
    if (!text.trim() || !require('comment')) return;
    try {
      await add({ postId: post.id, body: text.trim() }).unwrap();
      track('feed_engagement', { post_type: post.type, action: 'comment' });
      setText('');
    } catch (e) { toast.error(e); }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      <PostCard post={post} />
      <Card className="flex flex-col gap-3 p-4">
        <h2 className="font-display text-xl font-extrabold">{t('comments.title')} ({post.counts.comments})</h2>
        <div className="flex flex-col gap-2">
          <Textarea value={text} maxLength={settings.commentMaxChars} onChange={(e) => setText(e.target.value)} placeholder={t('comments.placeholder')} className="min-h-20" />
          <Button className="self-end" loading={sending} onClick={() => void send()}>{t('comments.send')}</Button>
        </div>
        {post.counts.comments === 0 ? <p className="py-3 text-center text-sm text-ink-muted">{t('comments.empty')}</p> : (
          <ul className="flex flex-col gap-3">{Array.from({ length: pages }, (_, i) => <CommentPage key={i} postId={post.id} page={i + 1} />)}</ul>
        )}
        {post.counts.comments > pages * 20 ? <Button variant="outline" onClick={() => setPages((p) => p + 1)}>{t('comments.loadMore')}</Button> : null}
      </Card>
    </div>
  );
}
