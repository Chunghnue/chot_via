import { viMessages } from '@chot-via/shared/i18n';
import type { PlaceDetail } from '@chot-via/shared';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SHARE_IMAGES } from '@/lib/post-share';

const BACKEND = process.env['BACKEND_URL'] ?? 'http://localhost:3001';
const fill = (text: string, params: Record<string, string>): string => text.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? '');

/** Thẻ xem trước riêng cho từng cửa hàng/văn phòng (ảnh "Cửa hàng 3D"; chưa có ảnh riêng cho văn phòng sale nên dùng chung). */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${BACKEND}/api/v1/places/${encodeURIComponent(slug)}`, { cache: 'no-store', headers: { 'x-requested-with': 'chotvia' } });
    if (!res.ok) return {};
    const json: unknown = await res.json();
    const place = (json as { data?: PlaceDetail }).data;
    if (!place) return {};
    const brand = viMessages.common.appName;
    const title = fill(viMessages.wish.postShare.place, { name: place.title });
    const description = fill(viMessages.wish.postShare.placeDescription, { brand });
    const image = SHARE_IMAGES.store;
    return {
      title, description,
      openGraph: { type: 'website', url: `/diem/${slug}`, title, description, siteName: brand, images: [{ url: image, width: 1200, height: 630, alt: title }] },
      twitter: { card: 'summary_large_image', title, description, images: [image] },
    };
  } catch {
    return {};
  }
}

export default function PlaceLayout({ children }: { children: ReactNode }) {
  return children;
}
