'use client';


import { viMessages } from '@chot-via/shared/i18n';
import { Card } from '@chot-via/ui';
import type { ReactNode } from 'react';
import { LegalLinks } from './legal-links';

/** Khối nội dung từ JSON: có `items` là danh sách gạch đầu dòng, không thì là đoạn văn `text`. */
type Block = { type: string; text?: string; items?: string[] };
export type LegalDoc = {
  title: string;
  updated: string | null;
  intro: Block[];
  sections: { heading: string; blocks: Block[]; subs: { heading: string; blocks: Block[] }[] }[];
};

const EMAIL = /([\w.+-]+@[\w-]+\.[\w.-]+)/g;
/** Biến địa chỉ email trong câu thành liên kết mailto. */
function withMail(text: string): ReactNode {
  return text.split(EMAIL).map((part, i) => (i % 2 === 1 ? <a key={i} href={`mailto:${part}`} className="font-semibold text-primary-strong underline">{part}</a> : part));
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return blocks.map((b, i) => b.items
    ? <ul key={i} className="mt-2 list-disc space-y-1 pl-6 leading-relaxed">{b.items.map((it, j) => <li key={j}>{withMail(it)}</li>)}</ul>
    : <p key={i} className="mt-2 leading-relaxed">{withMail(b.text ?? '')}</p>);
}

/** Trang văn bản pháp lý (máy chủ dựng sẵn để công cụ tìm kiếm và Facebook đọc được). */
export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-3 px-1 pb-6">
      <Card className="p-5 text-ink sm:p-8">
        <h1 className="font-display text-2xl font-extrabold text-primary-strong sm:text-3xl">{doc.title}</h1>
        {doc.updated ? <p className="mt-1 text-sm text-ink-muted">{viMessages.legal.footer.updatedLabel}: {doc.updated}</p> : null}
        <Blocks blocks={doc.intro} />
        {doc.sections.map((s) => (
          <section key={s.heading} className="mt-6">
            <h2 className="font-display text-xl font-extrabold">{s.heading}</h2>
            <Blocks blocks={s.blocks} />
            {s.subs.map((sub) => (
              <div key={sub.heading} className="mt-3">
                <h3 className="font-bold">{sub.heading}</h3>
                <Blocks blocks={sub.blocks} />
              </div>
            ))}
          </section>
        ))}
      </Card>
      <LegalLinks />
    </article>
  );
}
