import { describe, expect, it } from 'vitest';
import {
  AppSettingsSchema, CreatePostBodySchema, DEFAULT_SETTINGS, DemoPostInputSchema, ERROR_DEFS, HashtagSchema, PostListQuerySchema, SUCCESS_CODES, maskPhone,
  metricAllowedForRole, normalizeVnPhone,
} from '../src';
import { viMessages } from '../src/i18n';

describe('số điện thoại Việt Nam', () => {
  it.each([
    ['0912345678', '0912345678'],
    ['+84 912 345 678', '0912345678'],
    ['84912345678', '0912345678'],
    ['091.234.5678', '0912345678'],
    ['0339999999', '0339999999'],
  ])('chuẩn hóa %s', (raw, out) => {
    expect(normalizeVnPhone(raw)).toBe(out);
  });
  it.each(['', '12345', '0212345678', '091234567', '09123456789', 'abc'])('từ chối %s', (raw) => { expect(normalizeVnPhone(raw)).toBeNull(); });
  it('che số điện thoại', () => { expect(maskPhone('0912345678')).toBe('091****678'); expect(maskPhone('123')).toBe('123'); });
});

describe('cài đặt mặc định', () => {
  it('hợp lệ với schema', () => { expect(AppSettingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true); });
  it('đúng quyết định đã chốt: trọng số hot 1/2/1.5/3, bảng xếp hạng 100 / hiện 5, hiện dữ liệu mẫu', () => {
    expect(DEFAULT_SETTINGS.hot.weights).toEqual({ reaction: 1, comment: 2, wish: 1.5, share: 3 });
    expect(DEFAULT_SETTINGS.leaderboard).toEqual({ maxMembers: 100, defaultVisible: 5 });
    expect(DEFAULT_SETTINGS.showDemoData).toBe(true);
    expect(DEFAULT_SETTINGS.achievementRanges.ownerRevenue).toHaveLength(6);
    expect(DEFAULT_SETTINGS.achievementRanges.saleDeal).toHaveLength(6);
  });
});

describe('mã phản hồi và chữ hiển thị', () => {
  it('mọi mã lỗi và mã thành công đều có câu trong i18n codes.json', () => {
    const messages: Record<string, string> = viMessages.codes;
    const missing = [...Object.keys(ERROR_DEFS), ...SUCCESS_CODES].filter((c) => !(c in messages));
    expect(missing).toEqual([]);
  });
});

describe('DTO bài đăng', () => {
  it('Kể khổ tối thiểu hợp lệ, hashtag mặc định rỗng', () => {
    const r = CreatePostBodySchema.parse({ type: 'story', body: 'hôm nay vắng khách' });
    expect(r).toMatchObject({ type: 'story', hashtags: [], mediaIds: [] });
  });
  it('Khoe: giá trị mặc định là ẩn số tiền', () => {
    const r = CreatePostBodySchema.parse({ type: 'achievement', body: 'ok', role: 'owner', metricType: 'revenue' });
    expect(r).toMatchObject({ displayMode: 'hidden' });
  });
  it('từ chối loại bài lạ, hashtag sai và số tiền âm', () => {
    expect(CreatePostBodySchema.safeParse({ type: 'video', body: 'x' }).success).toBe(false);
    expect(HashtagSchema.safeParse('có dấu cách').success).toBe(false);
    expect(HashtagSchema.safeParse('kekho').success).toBe(true);
    expect(CreatePostBodySchema.safeParse({ type: 'achievement', body: 'x', role: 'sale', metricType: 'deal', displayMode: 'exact', amount: -5 }).success).toBe(false);
  });
  it('chỉ số khoe đúng theo vai trò', () => {
    expect(metricAllowedForRole('owner', 'revenue')).toBe(true);
    expect(metricAllowedForRole('owner', 'deal')).toBe(false);
    expect(metricAllowedForRole('sale', 'deal')).toBe(true);
    expect(metricAllowedForRole('sale', 'revenue')).toBe(false);
  });
  it('truy vấn danh sách: mặc định, pinned và has', () => {
    expect(PostListQuerySchema.parse({})).toMatchObject({ type: 'all', sort: 'new' });
    expect(PostListQuerySchema.parse({ pinned: 'first', has: 'photo' })).toMatchObject({ pinned: 'first', has: 'photo' });
    expect(PostListQuerySchema.safeParse({ has: 'video' }).success).toBe(false);
  });
  it('bài mẫu của admin kiểm tra giới hạn', () => {
    const ok = {
      authorId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      type: 'story',
      body: 'xin chào',
      hashtags: [],
      imageUrl: null,
      pinned: false,
      reactionCount: 1,
      commentCount: 0,
      shareCount: 0,
      hoursAgo: 2,
    };
    expect(DemoPostInputSchema.safeParse(ok).success).toBe(true);
    expect(DemoPostInputSchema.safeParse({ ...ok, reactionCount: -1 }).success).toBe(false);
    expect(DemoPostInputSchema.safeParse({ ...ok, type: 'wish_share' }).success).toBe(false);
  });
});
