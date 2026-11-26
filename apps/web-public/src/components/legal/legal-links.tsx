import { viMessages } from '@chot-via/shared/i18n';
import Link from 'next/link';

const L = viMessages.legal.footer;
export const LEGAL_LINKS = [
  { href: '/privacy-policy', label: L.privacy },
  { href: '/terms-of-service', label: L.terms },
  { href: '/data-deletion', label: L.dataDeletion },
] as const;

/** Hàng liên kết pháp lý cố định (Chính sách quyền riêng tư, Điều khoản dịch vụ, Xóa dữ liệu) và dòng bản quyền; dùng ở chân trang chủ và cuối các trang pháp lý. */
export function LegalLinks({ className }: { className?: string }) {
  return (
    <div className={className}>
      <nav aria-label={L.nav} className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-semibold text-ink">
        {LEGAL_LINKS.map((l) => <Link key={l.href} href={l.href} className="hover:text-primary-strong hover:underline">{l.label}</Link>)}
      </nav>
      <p className="mt-1 text-center text-xs text-ink-muted">{L.powered}{L.copyright}</p>
    </div>
  );
}
