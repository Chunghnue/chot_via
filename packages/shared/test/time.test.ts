import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, getTimeBucket, resolveWishTitleCode, vnDayStart, vnHour, vnWeekStart } from '../src';

const W = DEFAULT_SETTINGS.timeWindows;
/** Tạo mốc UTC từ giờ Việt Nam (UTC+7). */
const vn = (iso: string): Date => new Date(`${iso}+07:00`);

describe('khung giờ xin vía (giờ Việt Nam)', () => {
  it.each([
    ['2026-11-19T04:59:00', 'evening'], ['2026-11-19T05:00:00', 'morning'], ['2026-11-19T11:59:00', 'morning'],
    ['2026-11-19T12:00:00', 'afternoon'], ['2026-11-19T17:59:00', 'afternoon'], ['2026-11-19T18:00:00', 'evening'], ['2026-11-19T00:00:00', 'evening'],
  ])('%s → %s', (iso, bucket) => { expect(getTimeBucket(vn(iso), W)).toBe(bucket); });

  it('tính theo giờ Việt Nam chứ không theo UTC', () => {
    expect(vnHour(new Date('2026-11-19T23:00:00Z'))).toBe(6);
    expect(getTimeBucket(new Date('2026-11-19T23:00:00Z'), W)).toBe('morning');
  });

  it('khung giờ cấu hình được', () => {
    expect(getTimeBucket(vn('2026-11-19T06:00:00'), { morningStartHour: 7, afternoonStartHour: 13, eveningStartHour: 19 })).toBe('evening');
  });
});

describe('tiêu đề xin vía (FR-03)', () => {
  it('lần đầu luôn là "hôm nay" dù là buổi nào', () => {
    for (const bucket of ['morning', 'afternoon', 'evening'] as const) expect(resolveWishTitleCode({ sequence: 1, bucket, campaignMode: false })).toBe('today');
  });
  it('từ lần 2 theo giờ thực tế', () => {
    expect(resolveWishTitleCode({ sequence: 2, bucket: 'evening', campaignMode: false })).toBe('evening');
    expect(resolveWishTitleCode({ sequence: 7, bucket: 'morning', campaignMode: false })).toBe('morning');
  });
  it('chế độ campaign: lần 2 sáng, 3 chiều, 4 tối, sau đó theo giờ', () => {
    expect(resolveWishTitleCode({ sequence: 2, bucket: 'evening', campaignMode: true })).toBe('morning');
    expect(resolveWishTitleCode({ sequence: 3, bucket: 'evening', campaignMode: true })).toBe('afternoon');
    expect(resolveWishTitleCode({ sequence: 4, bucket: 'morning', campaignMode: true })).toBe('evening');
    expect(resolveWishTitleCode({ sequence: 5, bucket: 'afternoon', campaignMode: true })).toBe('afternoon');
  });
});

describe('đầu ngày / đầu tuần giờ Việt Nam', () => {
  it('đầu ngày là 00:00 VN', () => {
    expect(vnDayStart(vn('2026-11-19T15:30:00')).toISOString()).toBe(vn('2026-11-19T00:00:00').toISOString());
    expect(vnDayStart(vn('2026-11-19T00:00:00')).toISOString()).toBe(vn('2026-11-19T00:00:00').toISOString());
    expect(vnDayStart(vn('2026-11-19T23:59:59')).toISOString()).toBe(vn('2026-11-19T00:00:00').toISOString());
  });
  it('đầu tuần là thứ Hai 00:00 VN (19/11/2026 là thứ Năm)', () => {
    expect(vnWeekStart(vn('2026-11-19T10:00:00')).toISOString()).toBe(vn('2026-11-16T00:00:00').toISOString());
  });
  it('chính thứ Hai và Chủ nhật thuộc đúng tuần', () => {
    expect(vnWeekStart(vn('2026-11-16T00:00:00')).toISOString()).toBe(vn('2026-11-16T00:00:00').toISOString());
    expect(vnWeekStart(vn('2026-11-22T23:59:00')).toISOString()).toBe(vn('2026-11-16T00:00:00').toISOString());
    expect(vnWeekStart(vn('2026-11-23T00:00:00')).toISOString()).toBe(vn('2026-11-23T00:00:00').toISOString());
  });
});
