import { viMessages } from '@chot-via/shared/i18n';
import type { PostDto } from '@chot-via/shared';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { postShareImage, postSnippet } from '@/lib/post-share';

const BACKEND = process.env['BACKEND_URL'] ?? 'http://localhost:3001';
const fill = (text: string, params: Record<string, string>): string => text.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? '');

/** Thẻ xem trước riêng cho từng bài (Facebook, Zalo, Messenger đọc khi dán link): tiêu đề theo loại bài, mô tả là trích ngắn nội dung, ảnh theo loại bài. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND}/api/v1/posts/${encodeURIComponent(id)}`, { cache: 'no-store', headers: { 'x-requested-with': 'chotvia' } });
    if (!res.ok) return {};
    const json: unknown = await res.json();
    const post = (json as { data?: PostDto }).data;
    if (!post) return {};
    const brand = viMessages.common.appName;
    const title = fill(viMessages.wish.postShare.title[post.type], { name: post.author.displayName, brand });
    const description = postSnippet(post.body, 140) || viMessages.common.tagline;
    const image = postShareImage(post);
    return {
      title, description,
      openGraph: { type: 'article', url: `/bai/${id}`, title, description, siteName: brand, images: [{ url: image, width: 1200, height: 630, alt: title }] },
      twitter: { card: 'summary_large_image', title, description, images: [image] },
    };
  } catch {
    return {};
  }
}

export default function PostLayout({ children }: { children: ReactNode }) {
  return children;
}
