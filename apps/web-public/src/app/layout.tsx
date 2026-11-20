import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { viMessages } from '@chot-via/shared/i18n';
import { themeToken } from '@/lib/theme-token';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
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
