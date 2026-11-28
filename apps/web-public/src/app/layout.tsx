import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { viMessages } from '@xin-via/shared/i18n';
import { themeToken } from '@/lib/theme-token';
import { SPLASH_BOOT_SCRIPT, SplashScreen } from '@/components/splash-screen';
import { Providers } from './providers';
import './globals.css';

/** Tên miền công khai để ghép link tuyệt đối cho thẻ xem trước (Facebook/Zalo cần địa chỉ đầy đủ): đặt NEXT_PUBLIC_SITE_URL khi build cho từng server. */
const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://xinvia.co';
const META = viMessages.common.meta;
const OG_IMAGE = '/images/og/xin-via-home.jpg';

/** Thẻ head mặc định (trang chủ); các trang khác tự ghi đè tiêu đề/mô tả/ảnh (ví dụ bài viết `/bai/[id]`). Link tuyệt đối ghép từ `SITE_URL`. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: META.title, template: `%s | ${viMessages.common.appName}` },
  description: META.description,
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  applicationName: viMessages.common.appName,
  openGraph: {
    type: 'website', locale: 'vi_VN', siteName: viMessages.common.appName, url: '/', title: META.ogTitle, description: META.ogDescription,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: META.ogImageAlt }],
  },
  twitter: { card: 'summary_large_image', title: META.twitterTitle, description: META.twitterDescription, images: [OG_IMAGE] },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: themeToken('primary') };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_BOOT_SCRIPT }} />
      </head>
      <body>
        <SplashScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
