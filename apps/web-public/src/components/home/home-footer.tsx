'use client';

import { useGetHomeQuery } from '@chot-via/api-client';
import { Button } from '@chot-via/ui';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'use-intl';

interface InstallPromptEvent extends Event { prompt: () => Promise<void> }
const isInstallPrompt = (e: Event): e is InstallPromptEvent => 'prompt' in e && typeof e.prompt === 'function';

/** Chân trang của trang chủ (iPad ngang và máy tính): các nhóm liên kết do admin nhập + nút cài ứng dụng (PWA) khi trình duyệt cho phép. */
export function HomeFooter() {
  const t = useTranslations('home');
  const { data } = useGetHomeQuery();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event): void => { e.preventDefault(); if (isInstallPrompt(e)) setInstallEvent(e); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; href: string }[]>();
    for (const l of data?.layout.footerLinks ?? []) map.set(l.groupName, [...(map.get(l.groupName) ?? []), { label: l.label, href: l.href }]);
    return [...map.entries()];
  }, [data]);
  if (groups.length === 0 && !installEvent) return null;
  return (
    <footer className="mx-auto hidden w-full max-w-[1800px] border-t border-border bg-surface px-4 py-6 md:block 3xl:max-w-[2200px]">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex flex-wrap gap-10">
          {groups.map(([name, links]) => (
            <nav key={name} aria-label={name} className="flex flex-col gap-1.5">
              <p className="font-display text-sm font-extrabold text-ink">{name}</p>
              {links.map((l) => <Link key={l.href + l.label} href={l.href} className="text-sm text-ink-muted hover:text-primary-strong">{l.label}</Link>)}
            </nav>
          ))}
        </div>
        {installEvent ? <Button type="button" variant="soft" onClick={() => { void installEvent.prompt(); }}>{t('installApp')}</Button> : null}
      </div>
    </footer>
  );
}
