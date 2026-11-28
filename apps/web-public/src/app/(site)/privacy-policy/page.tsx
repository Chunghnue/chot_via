import { viMessages } from '@xin-via/shared/i18n';
import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/legal-document';

const DOC = viMessages.legal.privacy;

export const metadata: Metadata = {
  title: { absolute: DOC.seoTitle },
  description: DOC.seoDescription,
  alternates: { canonical: '/privacy-policy' },
  openGraph: { type: 'website', url: '/privacy-policy', title: DOC.seoTitle, description: DOC.seoDescription },
};

export default function PrivacyPage() {
  return <LegalDocument doc={DOC} />;
}
