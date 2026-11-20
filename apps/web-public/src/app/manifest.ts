import type { MetadataRoute } from 'next';
import { viMessages } from '@chot-via/shared/i18n';
import { themeToken } from '@/lib/theme-token';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${viMessages.common.appName} – ${viMessages.common.tagline}`,
    short_name: viMessages.common.appName,
    description: viMessages.common.disclaimer,
    lang: 'vi',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: themeToken('app'),
    theme_color: themeToken('primary'),
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
