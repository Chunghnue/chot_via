import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { viMessages } from '@chot-via/shared/i18n';
import { themeToken } from '@/lib/theme-token';
import { Providers } from './providers';
import './globals.css';

/** Tên miền công khai để ghép link tuyệt đối cho thẻ xem trước (Facebook/Zalo cần địa chỉ đầy đủ): đặt NEXT_PUBLIC_SITE_URL khi build cho từng server. */
const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://chotvia.divusoft.com';
const SHARE_TITLE = `${viMessages.common.appName} – Xin vía Thần Tài, chốt đơn thần tốc`;
const SHARE_DESCRIPTION = 'Xin vía Thần Tài miễn phí, ghé phố 3D, kể khổ và nhận may mắn cùng cộng đồng người bán hàng.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website', locale: 'vi_VN', siteName: viMessages.common.appName, url: '/', title: SHARE_TITLE, description: SHARE_DESCRIPTION,
    images: [{ url: '/images/og-chot-via.jpg', width: 1200, height: 630, alt: SHARE_TITLE }],
  },
  twitter: { card: 'summary_large_image', title: SHARE_TITLE, description: SHARE_DESCRIPTION, images: ['/images/og-chot-via.jpg'] },
  title: { default: `${viMessages.common.appName} – ${viMessages.common.tagline}`, template: `%s | ${viMessages.common.appName}` },
  description: viMessages.common.disclaimer,
  applicationName: viMessages.common.appName,
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: themeToken('primary') };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
