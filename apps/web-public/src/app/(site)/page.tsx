import { viMessages } from '@chot-via/shared/i18n';
import type { Metadata } from 'next';
import { HomePage } from './home-page';
import { HOME_SHARE_VIA, SHARE_IMAGES } from '@/lib/post-share';

const VIA_PREVIEW: Record<string, { image: string; title: string }> = {
  [HOME_SHARE_VIA.today]: { image: SHARE_IMAGES.today, title: viMessages.wish.shareCards.today },
  [HOME_SHARE_VIA.receive]: { image: SHARE_IMAGES.receive, title: viMessages.wish.shareCards.receive },
};

/** Trang chủ: canonical về "/"; link chia sẻ có `?via=` (xin vía hôm nay / nhận vía) thì thẻ xem trước dùng ảnh và câu của đúng hành động đó, còn lại giữ thẻ mặc định của trang chủ. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ via?: string }> }): Promise<Metadata> {
  const { via } = await searchParams;
  const preview = via ? VIA_PREVIEW[via] : undefined;
  if (!preview) return { alternates: { canonical: '/' } };
  const brand = viMessages.common.appName;
  return {
    alternates: { canonical: '/' },
    title: preview.title,
    openGraph: {
      type: 'website',
      url: `/?via=${via}`,
      title: preview.title,
      description: viMessages.common.meta.ogDescription,
      siteName: brand,
      images: [{ url: preview.image, width: 1200, height: 630, alt: preview.title }],
    },
    twitter: { card: 'summary_large_image', title: preview.title, description: viMessages.common.meta.twitterDescription, images: [preview.image] },
  };
}

export default function Page() {
  return <HomePage />;
}
