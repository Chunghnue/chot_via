import type { TimeBucket, WishTitleCode } from './enums';

/** Việt Nam cố định UTC+7, không có giờ mùa hè (Asia/Ho_Chi_Minh). */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface TimeWindows {
  morningStartHour: number;
  afternoonStartHour: number;
  eveningStartHour: number;
}

export function vnHour(date: Date): number {
  return new Date(date.getTime() + VN_OFFSET_MS).getUTCHours();
}

/** Mặc định theo tài liệu chiến lược giữ chân: sáng 06:00–10:59, chiều 11:00–20:59 (17:00–20:59 là giờ "Hôm nay thế nào rồi?"), tối 21:00–05:59; khung giờ cấu hình được. */
export function getTimeBucket(date: Date, w: TimeWindows): TimeBucket {
  const h = vnHour(date);
  if (h >= w.morningStartHour && h < w.afternoonStartHour) return 'morning';
  if (h >= w.afternoonStartHour && h < w.eveningStartHour) return 'afternoon';
  return 'evening';
}

/** Giờ bắt đầu khung "Hôm nay thế nào rồi?" (mời khoe doanh thu, deal hoặc kể khổ); kéo dài tới giờ bắt đầu buổi tối. */
export const REFLECT_START_HOUR = 17;

export function isReflectTime(date: Date, w: TimeWindows): boolean {
  const h = vnHour(date);
  return h >= REFLECT_START_HOUR && h < w.eveningStartHour;
}

/** Đầu ngày theo giờ Việt Nam, trả về mốc UTC. */
export function vnDayStart(date: Date): Date {
  const shifted = date.getTime() + VN_OFFSET_MS;
  return new Date(Math.floor(shifted / DAY_MS) * DAY_MS - VN_OFFSET_MS);
}

/** Đầu tuần (thứ Hai) theo giờ Việt Nam. */
export function vnWeekStart(date: Date): Date {
  const dayStart = vnDayStart(date);
  const weekday = new Date(dayStart.getTime() + VN_OFFSET_MS).getUTCDay();
  const sinceMonday = (weekday + 6) % 7;
  return new Date(dayStart.getTime() - sinceMonday * DAY_MS);
}

export interface WishTitleInput {
  /** Thứ tự lần xin vía trên thiết bị trong phiên (bắt đầu từ 1). */
  sequence: number;
  bucket: TimeBucket;
  /** Chế độ campaign: thứ tự cứng lần 2 sáng, 3 chiều, 4 tối (SRS mục 5). */
  campaignMode: boolean;
}

/** FR-03: lần 1 luôn "hôm nay"; từ lần 2 theo giờ thực (hoặc theo thứ tự cứng khi bật campaign). */
export function resolveWishTitleCode(input: WishTitleInput): WishTitleCode {
  if (input.sequence <= 1) return 'today';
  if (input.campaignMode) {
    if (input.sequence === 2) return 'morning';
    if (input.sequence === 3) return 'afternoon';
    if (input.sequence === 4) return 'evening';
  }
  return input.bucket;
}
