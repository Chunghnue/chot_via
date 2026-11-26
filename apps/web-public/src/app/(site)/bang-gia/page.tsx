'use client';

import { Card } from '@chot-via/ui';
import { Check } from 'lucide-react';
import { useTranslations } from 'use-intl';
import { PageTitle } from '@/components/common/require-member';

const PLANS = ['free', 'plus', 'business'] as const;
/** Bảng quyền lợi theo tài liệu chiến lược mục 6: mỗi dòng cho biết gói nào có. */
const FEATURES: { key: 'core' | 'shop' | 'collection' | 'diary' | 'brand' | 'stats'; has: readonly (typeof PLANS)[number][] }[] = [
  { key: 'core', has: ['free', 'plus', 'business'] },
  { key: 'shop', has: ['free', 'plus', 'business'] },
  { key: 'collection', has: ['plus', 'business'] },
  { key: 'diary', has: ['plus', 'business'] },
  { key: 'brand', has: ['business'] },
  { key: 'stats', has: ['business'] },
];
const REVENUE = ['premium', 'items', 'brandShop', 'sponsor', 'jobs', 'affiliate'] as const;

/** Bảng giá và gói thành viên (chỉ hiển thị; chưa có thanh toán nên nút đăng ký ở trạng thái "Sắp ra mắt"). */
export default function PricingPage() {
  const t = useTranslations('shop.pricing');
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <PageTitle>{t('title')}</PageTitle>
      <p className="text-center text-sm font-semibold text-ink">{t('sub')}</p>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-primary-soft">
              <th className="p-3 font-display text-base font-extrabold text-ink">{t('featureCol')}</th>
              {PLANS.map((p) => (
                <th key={p} className="p-3 text-center">
                  <span className="block font-display text-lg font-extrabold text-primary-strong">{t(`plans.${p}.name`)}</span>
                  <span className="block text-sm font-bold text-ink">{t(`plans.${p}.price`)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f) => (
              <tr key={f.key} className="border-t border-border/60">
                <td className="p-3 font-semibold text-ink">{t(`features.${f.key}`)}</td>
                {PLANS.map((p) => (
                  <td key={p} className="p-3 text-center">
                    {f.has.includes(p) ? <span className="inline-grid size-6 place-items-center rounded-full bg-primary text-on-primary" aria-label={t('yes')}><Check className="size-4" strokeWidth={3} aria-hidden /></span> : <span className="text-ink-subtle" aria-label={t('no')}>{t('no')}</span>}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-border/60 bg-surface-muted/60">
              <td className="p-3" />
              {PLANS.map((p) => <td key={p} className="p-3 text-center"><span className="inline-flex h-10 items-center rounded-full bg-surface px-5 text-sm font-bold text-ink-muted shadow-card ring-1 ring-border/60">{p === 'free' ? t('yes') : t('soon')}</span></td>)}
            </tr>
          </tbody>
        </table>
      </Card>
      <p className="text-center text-sm font-bold text-primary-strong">{t('principle')}</p>

      <h2 className="font-display text-xl font-extrabold text-ink">{t('revenueTitle')}</h2>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead><tr className="bg-gold-soft"><th className="p-3 font-bold text-ink">{t('revenueCol')}</th><th className="p-3 font-bold text-ink">{t('priceCol')}</th><th className="p-3 text-center font-bold text-ink">{t('priorityCol')}</th></tr></thead>
          <tbody>
            {REVENUE.map((r) => (
              <tr key={r} className="border-t border-border/60"><td className="p-3 font-semibold text-ink">{t(`revenue.${r}.name`)}</td><td className="p-3 text-ink">{t(`revenue.${r}.price`)}</td><td className="p-3 text-center font-bold text-primary-strong">{t(`revenue.${r}.p`)}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-center text-xs text-ink-subtle">{t('note')}</p>
    </div>
  );
}
