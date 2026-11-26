'use client';

import { Card } from '@chot-via/ui';
import { useTranslations } from 'use-intl';
import { PageTitle } from '@/components/common/require-member';

/** Vật phẩm 3D theo tài liệu chiến lược mục 7 (giá đề xuất, ảnh tham chiếu cắt từ thiết kế). Chưa có thanh toán nên nút mua ở trạng thái "Sắp ra mắt". */
const ITEMS: { key: 'cay' | 'hoaDao' | 'thanTai' | 'cong' | 'vanPhong' | 'daiPhun' | 'denLong'; img: string }[] = [
  { key: 'cay', img: '/images/vp-cay.webp' },
  { key: 'hoaDao', img: '/images/vp-hoa-dao.webp' },
  { key: 'thanTai', img: '/images/vp-than-tai.webp' },
  { key: 'cong', img: '/images/vp-cong.webp' },
  { key: 'vanPhong', img: '/images/vp-van-phong.webp' },
  { key: 'daiPhun', img: '/images/vp-dai-phun.webp' },
  { key: 'denLong', img: '/images/vp-den-long.webp' },
];

export default function ItemsPage() {
  const t = useTranslations('shop.items');
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <PageTitle>{t('title')}</PageTitle>
      <p className="text-center text-sm font-semibold text-ink">{t('sub')}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ITEMS.map((it) => (
          <li key={it.key}>
            <Card className="flex h-full flex-col items-center gap-2 bg-linear-to-b from-surface to-primary-soft/60 p-3 text-center">
              <div className="grid h-28 w-full place-items-center"><img loading="lazy" decoding="async" src={it.img} alt={t(`list.${it.key}.name`)} className="max-h-28 w-auto object-contain drop-shadow" draggable={false} /></div>
              <h2 className="font-display text-base font-extrabold text-ink">{t(`list.${it.key}.name`)}</h2>
              <p className="text-sm font-bold text-wish-strong">{t(`list.${it.key}.price`)}</p>
              <span className="mt-auto inline-flex h-9 items-center rounded-full bg-surface px-4 text-xs font-bold text-ink-muted shadow-card ring-1 ring-border/60">{t('soon')}</span>
            </Card>
          </li>
        ))}
      </ul>
      <Card className="bg-gold-soft p-4"><h2 className="font-display text-lg font-extrabold text-ink">{t('season')}</h2><p className="text-sm text-ink">{t('seasonText')}</p></Card>
    </div>
  );
}
