import { describe, expect, it } from 'vitest';
import { composerClosed, composerOpened, composerSlice, draftChanged, kindChosen, stepChanged } from '../src/features/composer/composerSlice';
import { feedSlice, feedSortChanged, feedTypeChanged } from '../src/features/feed/feedSlice';
import { loginRequested, ritualAsked, ritualEnded, ritualOfferClosed, ritualOffered, ritualPlaying, ritualStarted, uiSlice, wishRequested } from '../src/features/ui/uiSlice';
import { currentCleared, wishRecorded, wishSlice, wishSynced, type WishEntry } from '../src/features/wish/wishSlice';

const entry = (at: string, titleCode: WishEntry['titleCode'] = 'today', offline = false): WishEntry => ({ at, titleCode, templateId: 't1', offline });
const record = (e: WishEntry) => wishRecorded({ entry: e, text: 'Chúc bạn đông khách', animationKey: 'sparkle', pointsAwarded: false });

describe('wishSlice — bộ đếm xin vía', () => {
  it('ghi nhận lần xin vía, giữ lời chúc hiện tại và mẫu vừa nhận', () => {
    let s = wishSlice.reducer(undefined, { type: 'init' });
    s = wishSlice.reducer(s, record(entry(new Date().toISOString())));
    expect(s.entries).toHaveLength(1);
    expect(s.lastTemplateId).toBe('t1');
    expect(s.current?.text).toBe('Chúc bạn đông khách');
    expect(wishSlice.reducer(s, currentCleared()).current).toBeNull();
  });

  it('lời chúc dự phòng (mất mạng) không làm mẫu "vừa nhận" thay đổi', () => {
    let s = wishSlice.reducer(undefined, { type: 'init' });
    s = wishSlice.reducer(s, record(entry(new Date().toISOString(), 'today', true)));
    expect(s.lastTemplateId).toBeNull();
    expect(s.current?.offline).toBe(true);
  });

  it('đồng bộ từ máy chủ: gộp lần xin vía của thiết bị khác, không trùng lặp, sắp theo thời gian', () => {
    let s = wishSlice.reducer(undefined, { type: 'init' });
    s = wishSlice.reducer(s, record(entry('2026-11-19T02:00:00.000Z')));
    s = wishSlice.reducer(s, wishSynced([entry('2026-11-19T01:00:00.000Z'), entry('2026-11-19T02:00:00.000Z', 'morning'), entry('2026-11-19T03:00:00.000Z', 'afternoon')]));
    expect(s.entries.map((e) => e.at)).toEqual(['2026-11-19T01:00:00.000Z', '2026-11-19T02:00:00.000Z', '2026-11-19T03:00:00.000Z']);
  });

  it('đồng bộ danh sách rỗng không đổi gì', () => {
    const s = wishSlice.reducer(undefined, { type: 'init' });
    expect(wishSlice.reducer(s, wishSynced([]))).toEqual(s);
  });
});

describe('composerSlice — bản nháp', () => {
  it('mở thẳng một loại bài thì vào bước soạn; mở không loại thì hiện bước chọn', () => {
    let s = composerSlice.reducer(undefined, composerOpened({ kind: 'story' }));
    expect(s).toMatchObject({ open: true, step: 'edit' });
    expect(s.draft?.kind).toBe('story');
    s = composerSlice.reducer(undefined, composerOpened(undefined));
    expect(s).toMatchObject({ open: true, step: 'choose', draft: null });
  });

  it('bản nháp được giữ khi đóng không hủy (qua bước đăng nhập) và mở lại', () => {
    let s = composerSlice.reducer(undefined, kindChosen({ kind: 'story' }));
    s = composerSlice.reducer(s, draftChanged({ body: 'Hôm nay vắng khách' }));
    s = composerSlice.reducer(s, composerClosed({ discard: false }));
    expect(s.open).toBe(false);
    s = composerSlice.reducer(s, composerOpened(undefined));
    expect(s).toMatchObject({ open: true, step: 'edit' });
    expect(s.draft?.body).toBe('Hôm nay vắng khách');
  });

  it('hủy bản nháp xóa nội dung và quay về bước chọn', () => {
    let s = composerSlice.reducer(undefined, kindChosen({ kind: 'brag', role: 'sale' }));
    s = composerSlice.reducer(s, composerClosed({ discard: true }));
    expect(s).toMatchObject({ open: false, draft: null, step: 'choose' });
  });

  it('Khoe theo vai trò: đổi vai trò tạo bản nháp mới với chỉ số đúng vai trò', () => {
    let s = composerSlice.reducer(undefined, composerOpened({ kind: 'brag', role: 'owner' }));
    expect(s.draft?.role).toBe('owner');
    expect(s.draft?.metricType).toBe('revenue');
    s = composerSlice.reducer(s, composerOpened({ kind: 'brag', role: 'sale' }));
    expect(s.draft?.role).toBe('sale');
    expect(s.draft?.metricType).toBe('deal');
  });

  it('khoe mặc định ẩn số tiền; chuyển bước xem trước', () => {
    let s = composerSlice.reducer(undefined, kindChosen({ kind: 'brag' }));
    expect(s.draft?.displayMode).toBe('hidden');
    s = composerSlice.reducer(s, stepChanged('preview'));
    expect(s.step).toBe('preview');
  });
});

describe('feed / ui slice', () => {
  it('bộ lọc bảng tin chỉ đổi trạng thái lọc trong cùng một feed', () => {
    let s = feedSlice.reducer(undefined, { type: 'init' });
    expect(s).toMatchObject({ type: 'all', sort: 'new', role: null });
    s = feedSlice.reducer(s, feedTypeChanged('story'));
    s = feedSlice.reducer(s, feedSortChanged('hot'));
    expect(s).toMatchObject({ type: 'story', sort: 'hot' });
  });

  it('xin vía một chạm: mỗi lần bấm tăng bộ đếm, bấm liền trong thời gian khóa thì bỏ qua', () => {
    let s = uiSlice.reducer(undefined, { type: wishRequested.type, payload: 10_000 });
    expect(s.wishRequest).toBe(1);
    s = uiSlice.reducer(s, { type: wishRequested.type, payload: 11_000 });
    expect(s.wishRequest).toBe(1);
    s = uiSlice.reducer(s, { type: wishRequested.type, payload: 13_001 });
    expect(s.wishRequest).toBe(2);
  });

  it('nghi lễ: chưa có cửa hàng thì nhớ việc đang chờ, tạo xong hiện hộp mời, bắt đầu thì dọn hộp và chạy một lượt', () => {
    const target = { placeId: 'p1', title: 'Quán Cafe', modelKey: 'cafe' } as const;
    let s = uiSlice.reducer(undefined, ritualAsked('burn'));
    expect(s.ritualPending).toBe('burn');
    s = uiSlice.reducer(s, ritualOffered(target));
    expect(s.ritualOffer).toEqual(target);
    s = uiSlice.reducer(s, ritualStarted({ kind: 'burn', ...target }));
    expect(s.ritual).toMatchObject({ kind: 'burn', placeId: 'p1', tick: 1, startedAt: null });
    expect(s.ritualOffer).toBeNull();
    expect(s.ritualPending).toBeNull();
    // đang chạy dở thì bấm tiếp bị bỏ qua
    expect(uiSlice.reducer(s, ritualStarted({ kind: 'invoke', ...target })).ritual?.kind).toBe('burn');
    // cảnh báo bắt đầu: chỉ nhận đúng lượt và chỉ một lần
    s = uiSlice.reducer(s, { type: ritualPlaying.type, payload: { tick: 99, at: 5 } });
    expect(s.ritual?.startedAt).toBeNull();
    s = uiSlice.reducer(s, { type: ritualPlaying.type, payload: { tick: 1, at: 5 } });
    s = uiSlice.reducer(s, { type: ritualPlaying.type, payload: { tick: 1, at: 9 } });
    expect(s.ritual?.startedAt).toBe(5);
    // hết giờ: chạy lại được, không giới hạn số lần, tick tăng
    s = uiSlice.reducer(s, ritualEnded());
    s = uiSlice.reducer(s, ritualStarted({ kind: 'invoke', ...target }));
    expect(s.ritual).toMatchObject({ kind: 'invoke', tick: 2 });
  });

  it('nghi lễ: đóng hộp mời thì bỏ luôn việc đang chờ', () => {
    let s = uiSlice.reducer(undefined, ritualAsked('invoke'));
    s = uiSlice.reducer(s, ritualOffered({ placeId: 'p1', title: 'Quán', modelKey: 'cafe' }));
    s = uiSlice.reducer(s, ritualOfferClosed());
    expect(s.ritualOffer).toBeNull();
    expect(s.ritualPending).toBeNull();
  });

  it('yêu cầu đăng nhập theo hành động', () => {
    const s = uiSlice.reducer(undefined, loginRequested('post'));
    expect(s.login).toEqual({ open: true, reason: 'post' });
  });
});
