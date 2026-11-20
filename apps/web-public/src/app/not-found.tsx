import Link from 'next/link';
import { viMessages } from '@chot-via/shared/i18n';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <span aria-hidden className="text-6xl">🧭</span>
      <p className="font-display text-2xl font-bold text-ink">{viMessages.common.pageNotFound}</p>
      <Link href="/" className="rounded-full bg-primary px-6 py-3 font-semibold text-on-primary">{viMessages.common.goHome}</Link>
    </main>
  );
}
