'use client';

import { useGetHomeQuery } from '@chot-via/api-client';
import { Button } from '@chot-via/ui';
import { Link2, Music2, MonitorDown } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'use-intl';

interface InstallPromptEvent extends Event { prompt: () => Promise<void> }
const isInstallPrompt = (e: Event): e is InstallPromptEvent => 'prompt' in e && typeof e.prompt === 'function';

/** Nhóm liên kết dành cho biểu tượng mạng xã hội (admin nhập: nhãn facebook / zalo / tiktok / khác = liên kết chung). */
export const SOCIAL_GROUP = 'Mạng xã hội';

function SocialIcon({ label }: { label: string }) {
  const key = label.trim().toLowerCase();
  if (key === 'facebook') return <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z" /></svg>;
  if (key === 'tiktok') return <Music2 className="size-5" aria-hidden />;
  if (key === 'zalo') return <span aria-hidden className="text-[0.7rem] font-extrabold leading-none">Zalo</span>;
  return <Link2 className="size-5" aria-hidden />;
}

/**
 * Chân trang của trang chủ theo ảnh thiết kế (iPad ngang và máy tính): logo + khẩu hiệu, hàng liên kết, nút "Tải ứng dụng / PWA", "Chia sẻ Chốt Vía" với biểu tượng mạng xã hội.
 * Liên kết và mạng xã hội do admin nhập (menu "Liên kết chân trang"); chưa nhập thì không hiện.
 */
export function HomeFooter() {
  const t = useTranslations('home');
  const tn = useTranslations('nav');
  const { data } = useGetHomeQuery();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  useEffect(() => {
    const onPrompt = (e: Event): void => { e.preventDefault(); if (isInstallPrompt(e)) setInstallEvent(e); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);
  const { links, social } = useMemo(() => {
    const all = data?.layout.footerLinks ?? [];
    return { links: all.filter((l) => l.groupName !== SOCIAL_GROUP), social: all.filter((l) => l.groupName === SOCIAL_GROUP) };
  }, [data]);
  return (
    <footer className="mx-auto hidden w-full max-w-[1800px] border-t border-border bg-linear-to-b from-surface to-primary-soft/60 px-4 py-5 md:block 3xl:max-w-[2200px]">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <Link href="/" className="flex items-center gap-2" aria-label={tn('home')}>
          <img src="/images/logo-co.webp" alt="" aria-hidden className="size-12 object-contain" draggable={false} />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-2xl font-extrabold text-primary-strong">Chốt Vía</span>
            <span className="text-xs font-medium text-ink-muted">{t('tagline')}</span>
          </span>
        </Link>
        {links.length > 0 ? (
          <nav aria-label={t('footerLinks')} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink">
            {links.map((l, i) => (
              <span key={l.href + l.label} className="flex items-center gap-4">
                {i > 0 ? <span aria-hidden className="h-4 w-px bg-border" /> : null}
                <Link href={l.href} className="hover:text-primary-strong">{l.label}</Link>
              </span>
            ))}
          </nav>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col items-start gap-1">
            <Button type="button" variant="soft" onClick={() => { if (installEvent) void installEvent.prompt(); else setShowHelp((v) => !v); }}>
              <MonitorDown className="size-5" aria-hidden />{t('installApp')}
            </Button>
            {showHelp && !installEvent ? <p className="max-w-56 text-xs text-ink-muted">{t('installHelp')}</p> : null}
          </div>
          {social.length > 0 ? (
            <div className="flex flex-col items-center gap-1 rounded-2xl bg-surface px-3 py-2 shadow-card">
              <p className="text-xs font-semibold text-ink">{t('shareApp')}</p>
              <div className="flex items-center gap-2">
                {social.map((s) => (
                  <a key={s.href + s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    className="grid size-9 place-items-center rounded-full bg-primary-soft text-primary-strong transition hover:bg-primary hover:text-on-primary">
                    <SocialIcon label={s.label} />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
