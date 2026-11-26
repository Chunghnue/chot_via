'use client';

import { useGetHomeQuery } from '@chot-via/api-client';
import { BrandIcon, toast } from '@chot-via/ui';
import { Link2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'use-intl';
import { useShareTo } from '@/components/common/share-buttons';
import { siteUrl, type ShareTarget } from '@/lib/share';

interface InstallPromptEvent extends Event { prompt: () => Promise<void> }
const isInstallPrompt = (e: Event): e is InstallPromptEvent => 'prompt' in e && typeof e.prompt === 'function';

/** Nhóm liên kết dành cho biểu tượng mạng xã hội (admin nhập: nhãn facebook / zalo / tiktok / khác = liên kết chung). */
export const SOCIAL_GROUP = 'Mạng xã hội';

/** Mạng xã hội có thể chia sẻ tới từ nhãn liên kết (không phân biệt hoa thường). */
function shareTarget(label: string): ShareTarget | null {
  const key = label.trim().toLowerCase();
  return key === 'facebook' || key === 'zalo' || key === 'tiktok' ? key : null;
}

/** Chọn biểu tượng theo nhãn liên kết admin nhập (không phân biệt hoa thường); nhãn lạ = biểu tượng liên kết. */
export function SocialIcon({ label }: { label: string }) {
  const key = label.trim().toLowerCase();
  return key === 'facebook' || key === 'tiktok' || key === 'zalo' ? <BrandIcon brand={key} /> : <Link2 className="size-5" aria-hidden />;
}

/** Biểu tượng chân trang theo ảnh thiết kế: Facebook (tròn xanh), Zalo (vuông bo viền xanh), TikTok (tròn đen), liên kết (chuỗi đen). */
function FooterSocialIcon({ label }: { label: string }) {
  const key = label.trim().toLowerCase();
  if (key === 'facebook') return <span aria-hidden className="grid size-9 place-items-center rounded-full bg-brand-facebook text-on-primary"><BrandIcon brand="facebook" className="size-6" /></span>;
  if (key === 'zalo') return <span aria-hidden className="grid size-9 place-items-center rounded-[0.7rem] border-[2.5px] border-brand-zalo bg-surface text-[0.6rem] text-brand-zalo"><BrandIcon brand="zalo" className="text-[0.6rem]" /></span>;
  if (key === 'tiktok') return <span aria-hidden className="grid size-9 place-items-center rounded-full bg-brand-tiktok text-on-primary"><BrandIcon brand="tiktok" /></span>;
  return <span aria-hidden className="grid size-9 place-items-center text-ink"><Link2 className="size-7" strokeWidth={2.4} /></span>;
}

/** Màn hình xanh của nút "Tải ứng dụng / PWA" (theo ảnh thiết kế). */
function MonitorMark() {
  return (
    <svg viewBox="0 0 52 46" className="h-11 w-12 shrink-0" aria-hidden>
      <rect x="2" y="2" width="48" height="32" rx="5" className="fill-primary" />
      <rect x="6.5" y="6.5" width="39" height="23" rx="2.5" className="fill-primary-bright" />
      <path d="M26 34v8M16 43h20" className="stroke-primary" strokeWidth="3.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Nút "Tải ứng dụng / PWA" (hộp cài đặt của trình duyệt, hoặc hướng dẫn thêm vào màn hình chính khi trình duyệt không có hộp cài như Safari) và khối "Chia sẻ Chốt Vía" với biểu tượng mạng xã hội; dùng ở chân trang máy tính và thẻ cuối trang điện thoại. */
function InstallAndShare({ social, stacked = false }: { social: readonly { label: string; href: string }[]; stacked?: boolean }) {
  const t = useTranslations('home');
  const shareTo = useShareTo();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  useEffect(() => {
    const onPrompt = (e: Event): void => { e.preventDefault(); if (isInstallPrompt(e)) setInstallEvent(e); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);
  return (
    <div className={stacked ? 'flex w-full flex-col items-stretch gap-3' : 'flex shrink-0 flex-wrap items-center gap-4'}>
      <div className="flex flex-col items-center gap-1">
        <button type="button" onClick={() => { if (installEvent) void installEvent.prompt(); else setShowHelp((v) => !v); }}
          className={`flex items-center justify-center gap-3 rounded-[2rem] bg-surface px-7 py-3 shadow-card ring-1 ring-surface transition hover:shadow-md active:scale-[0.98] ${stacked ? 'w-full' : ''}`}>
          <MonitorMark />
          <span className="whitespace-nowrap text-[0.95rem] font-bold text-ink">{t('installApp')}</span>
        </button>
        {showHelp && !installEvent ? <p className={`text-xs text-ink-muted ${stacked ? 'text-center' : 'max-w-56'}`}>{t('installHelp')}</p> : null}
      </div>
      <div className="flex flex-col items-center gap-1.5 rounded-[2rem] bg-surface px-7 py-2.5 shadow-card ring-1 ring-surface">
        <p className="text-sm font-semibold text-ink">{t('shareApp')}</p>
        <div className="flex items-center gap-4">
          {social.map((s) => {
            // Liên kết mẫu '#': chưa có địa chỉ thật thì bấm là chia sẻ Chốt Vía lên mạng đó (sao chép nội dung + mở cửa sổ chia sẻ).
            if (s.href === '#') return <button key={s.label} type="button" aria-label={s.label} title={s.label} className="transition hover:scale-110 active:scale-95" onClick={() => { const target = shareTarget(s.label); if (target) void shareTo(target, t('shareText')); }}><FooterSocialIcon label={s.label} /></button>;
            return (
              <a key={s.href + s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label} className="transition hover:scale-110 active:scale-95">
                <FooterSocialIcon label={s.label} />
              </a>
            );
          })}
          <button type="button" aria-label={t('copyLink')} title={t('copyLink')} className="transition hover:scale-110 active:scale-95"
            onClick={() => { void navigator.clipboard.writeText(siteUrl()).then(() => toast.success(t('linkCopied'))).catch(() => undefined); }}><FooterSocialIcon label="link" /></button>
        </div>
      </div>
    </div>
  );
}

/**
 * Chân trang của trang chủ theo ảnh thiết kế (iPad ngang và máy tính): logo + khẩu hiệu, hàng liên kết, nút "Tải ứng dụng / PWA", "Chia sẻ Chốt Vía" với biểu tượng mạng xã hội.
 * Liên kết và mạng xã hội do admin nhập (menu "Liên kết chân trang"); chưa nhập thì không hiện.
 */
export function HomeFooter() {
  const t = useTranslations('home');
  const tn = useTranslations('nav');
  const { data } = useGetHomeQuery();
  const { links, social } = useMemo(() => {
    const all = data?.layout.footerLinks ?? [];
    return { links: all.filter((l) => l.groupName !== SOCIAL_GROUP), social: all.filter((l) => l.groupName === SOCIAL_GROUP) };
  }, [data]);
  return (
    <>
    {/* Điện thoại: chân trang đầy đủ bị ẩn nên có thẻ riêng ngay cuối trang chủ để cài ứng dụng và chia sẻ Chốt Vía. */}
    <section aria-label={t('installApp')} className="mx-auto w-full px-3 pb-28 md:hidden">
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-linear-to-b from-surface to-primary-soft p-4 shadow-card ring-1 ring-surface">
        <Link href="/" className="flex items-center gap-2" aria-label={tn('home')}>
          <img loading="lazy" decoding="async" src="/images/logo-than-tai.webp" alt="" aria-hidden className="size-12 object-contain" draggable={false} />
          <span className="font-display text-2xl font-extrabold italic text-primary-strong">Chốt Vía</span>
        </Link>
        <InstallAndShare social={social} stacked />
        {links.length > 0 ? (
          <nav aria-label={t('footerLinks')} className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-semibold text-ink">
            {links.map((l) => <Link key={l.href + l.label} href={l.href} className="hover:text-primary-strong">{l.label}</Link>)}
          </nav>
        ) : null}
      </div>
    </section>
    <footer className="mx-auto hidden w-full max-w-[1800px] rounded-t-[2.5rem] border-t border-primary/20 bg-linear-to-b from-surface via-primary-soft/70 to-primary-soft px-6 py-6 md:block 3xl:max-w-[2200px]">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 min-[1440px]:flex-nowrap">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={tn('home')}>
          <img loading="lazy" decoding="async" src="/images/logo-than-tai.webp" alt="" aria-hidden className="size-16 object-contain" draggable={false} />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-3xl font-extrabold italic text-primary-strong">Chốt Vía</span>
            <span className="text-[0.8rem] font-bold italic tracking-tight text-ink">{t('tagline')}</span>
          </span>
        </Link>
        {links.length > 0 ? (
          <nav aria-label={t('footerLinks')} className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink min-[1440px]:flex-1 min-[1440px]:justify-center">
            {links.map((l, i) => (
              <span key={l.href + l.label} className="flex items-center gap-4">
                {i > 0 ? <span aria-hidden className="h-4 w-px bg-border" /> : null}
                <Link href={l.href} className="hover:text-primary-strong">{l.label}</Link>
              </span>
            ))}
          </nav>
        ) : null}
        <InstallAndShare social={social} />
      </div>
    </footer>
    </>
  );
}
