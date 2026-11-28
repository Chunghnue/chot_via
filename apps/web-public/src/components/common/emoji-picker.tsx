'use client';

import { cn } from '@xin-via/ui';
import { useEffect, useState } from 'react';
import { useTranslations } from 'use-intl';
import { EMOJI_GROUPS, EMOJI_GROUP_ICONS, pushRecentEmoji, readRecentEmoji, type EmojiGroup } from '@/lib/emoji-data';

type Tab = EmojiGroup | 'recent';

/** Bảng biểu tượng cảm xúc: tab nhóm (có "Dùng gần đây"), lưới biểu tượng; bấm một biểu tượng thì gọi `onPick`. */
export function EmojiPicker({ onPick, className }: { onPick: (emoji: string) => void; className?: string }) {
  const t = useTranslations('post.composer.emojiCats');
  const [tab, setTab] = useState<Tab>('smile');
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => { setRecent(readRecentEmoji()); }, []);
  const list: readonly string[] = tab === 'recent' ? recent : EMOJI_GROUPS[tab];
  const tabs: Tab[] = [...(recent.length > 0 ? (['recent'] as const) : []), ...(Object.keys(EMOJI_GROUPS) as EmojiGroup[])];
  return (
    <div className={cn('rounded-2xl border border-border bg-surface p-2 shadow-card', className)} role="dialog" aria-label={t('recent')}>
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none" role="tablist">
        {tabs.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            title={t(k)}
            aria-label={t(k)}
            onClick={() => setTab(k)}
            className={cn('grid size-9 shrink-0 place-items-center rounded-full text-xl transition hover:bg-surface-muted', tab === k && 'bg-primary-soft ring-1 ring-primary')}
          >
            {k === 'recent' ? '🕘' : EMOJI_GROUP_ICONS[k]}
          </button>
        ))}
      </div>
      <p className="px-1 pb-1 text-xs font-bold text-ink-muted">{t(tab)}</p>
      <div className="grid max-h-44 grid-cols-8 gap-0.5 overflow-y-auto sm:grid-cols-10">
        {list.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => {
              onPick(e);
              setRecent(pushRecentEmoji(e));
            }}
            className="grid size-9 place-items-center rounded-lg text-2xl transition hover:bg-surface-muted active:scale-90"
            aria-label={e}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
