/** Định dạng số/ngày dùng Intl theo locale vi, múi giờ Việt Nam. Chữ đơn vị lấy từ i18n (common.money*). */
export const NUMBER_LOCALE = 'vi-VN';

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits }).format(value);
}

export interface MoneyLabels { billion: (value: string) => string; million: (value: string) => string; thousand: (value: string) => string; dong: (value: string) => string }

/** 1.200.000.000 → "1,2 tỷ"; 15.800.000 → "15,8 triệu". */
export function formatMoneyShort(value: number, labels: MoneyLabels): string {
  if (value >= 1_000_000_000) return labels.billion(formatNumber(value / 1_000_000_000, 2));
  if (value >= 1_000_000) return labels.million(formatNumber(value / 1_000_000, 2));
  if (value >= 1_000) return labels.thousand(formatNumber(value / 1_000, 1));
  return labels.dong(formatNumber(value));
}

export function formatDateTime(date: Date | string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }): string {
  return new Intl.DateTimeFormat(NUMBER_LOCALE, { timeZone: 'Asia/Ho_Chi_Minh', ...options }).format(typeof date === 'string' ? new Date(date) : date);
}

export function formatClock(date: Date | string): string {
  return formatDateTime(date, { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Rút gọn số đếm: 1.200 → "1.2k", 12.500 → "12.5k"; dưới 1.000 giữ nguyên. */
export function compactCount(value: number): string {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
}
