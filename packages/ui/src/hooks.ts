import { useTranslations } from 'use-intl';
import { viMessages } from '@xin-via/shared/i18n';
import type { MemberRole, RangeDef } from '@xin-via/shared';
import { formatClock, formatDateTime, formatMoneyShort, formatNumber } from './lib/format';

/** Gom hàm định dạng + chữ đơn vị theo i18n để mọi màn hình hiển thị số tiền/thời gian nhất quán. */
export function useFormatters() {
  const t = useTranslations('common');
  const tp = useTranslations('post');

  const money = (value: number): string =>
    formatMoneyShort(value, {
      billion: (v) => t('moneyBillion', { value: v }), million: (v) => t('moneyMillion', { value: v }),
      thousand: (v) => t('moneyThousand', { value: v }), dong: (v) => t('moneyDong', { value: v }),
    });

  const relative = (iso: string): string => {
    const diffSec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (diffSec < 60) return t('justNow');
    const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
    if (diffSec < 3600) return rtf.format(-Math.floor(diffSec / 60), 'minute');
    if (diffSec < 86_400) return rtf.format(-Math.floor(diffSec / 3600), 'hour');
    if (diffSec < 7 * 86_400) return rtf.format(-Math.floor(diffSec / 86_400), 'day');
    return formatDateTime(iso, { dateStyle: 'medium' });
  };

  const range = (r: RangeDef): string => {
    if (r.minVnd === null && r.maxVnd !== null) return tp('range.under', { max: money(r.maxVnd) });
    if (r.minVnd !== null && r.maxVnd === null) return tp('range.over', { min: money(r.minVnd) });
    return tp('range.between', { min: money(r.minVnd ?? 0), max: money(r.maxVnd ?? 0) });
  };

  return { money, relative, range, number: formatNumber, date: (iso: string) => formatDateTime(iso, { dateStyle: 'medium' }), clock: formatClock };
}

type CodeKey = keyof typeof viMessages.codes;
type ValidationKey = keyof typeof viMessages.validation;
const isCodeKey = (code: string): code is CodeKey => code in viMessages.codes;
const isValidationKey = (rule: string): rule is ValidationKey => rule in viMessages.validation;

/** Backend chỉ trả mã; hook này ánh xạ mã (kèm tham số) thành câu chữ từ i18n. */
export function useCodeMessage() {
  const t = useTranslations('codes');
  return (code: string, params: Record<string, string | number> = {}): string => (isCodeKey(code) ? t(code, params) : t('UNKNOWN'));
}

/** Ánh xạ quy tắc validate (too_small, invalid_string…) thành câu chữ. */
export function useValidationMessage() {
  const t = useTranslations('validation');
  return (rule: string, params: Record<string, string | number> = {}): string => (isValidationKey(rule) ? t(rule, params) : t('invalid'));
}

/** Nhãn vai trò (Chủ quán / Sale) từ một nguồn chữ duy nhất. */
export function useRoleLabel(): (role: MemberRole) => string {
  const t = useTranslations('post.roles');
  return (role) => t(role);
}
