import { viMessages } from '@chot-via/shared/i18n';
import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/legal-document';

const DOC = viMessages.legal.dataDeletion;

export const metadata: Metadata = {
  title: { absolute: DOC.seoTitle },
  description: DOC.seoDescription,
  alternates: { canonical: '/data-deletion' },
  openGraph: { type: 'website', url: '/data-deletion', title: DOC.seoTitle, description: DOC.seoDescription },
};

export default function DataDeletionPage() {
  return <LegalDocument doc={DOC} />;
}
