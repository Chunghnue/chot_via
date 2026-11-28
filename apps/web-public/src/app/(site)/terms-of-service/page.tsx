import { viMessages } from '@xin-via/shared/i18n';
import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/legal-document';

const DOC = viMessages.legal.terms;

export const metadata: Metadata = {
  title: { absolute: DOC.seoTitle },
  description: DOC.seoDescription,
  alternates: { canonical: '/terms-of-service' },
  openGraph: { type: 'website', url: '/terms-of-service', title: DOC.seoTitle, description: DOC.seoDescription },
};

export default function TermsPage() {
  return <LegalDocument doc={DOC} />;
}
