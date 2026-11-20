import { describe, expect, it } from 'vitest';
import { adminLogin, catalog, del, get, login, patch, post, put, freshIp } from './support/api';

interface PlaceRow { id: string; slug: string; title: string; kind: string; isDemo: boolean; wishCount: number; likeCount: number; followCount: number; coverUrl: string | null; modelKey: string }
interface Detail extends PlaceRow { owner: { displayName: string } | null; viewer: { liked: boolean; following: boolean; isOwner: boolean } | null; province: string | null }
interface Board { weekStartsAt: string; items: { rank: number; place: PlaceRow; wishes: number }[] }

describe('danh sách và chi tiết', () => {
  it('khách xem được danh sách điểm trên phố (có dữ liệu mẫu)', async () => {
    const r = await get<PlaceRow[]>('/places?pageSize=50');
    expect(r.status).toBe(200);
    expect(r.data.filter((p) => p.isDemo).length).toBeGreaterThanOrEqual(6);
    expect((r.meta as { hasMore: boolean }).hasMore).toBe(false);
  });

  it('lọc theo loại và tìm kiếm theo tên', async () => {
    const sale = await get<PlaceRow[]>('/places?kind=sale_office');
    expect(sale.data.length).toBeGreaterThanOrEqual(2);
    expect(sale.data.every((p) => p.kind === 'sale_office')).toBe(true);
    const found = await get<PlaceRow[]>('/places?search=An%20Nhi%C3%AAn');
    expect(found.data.map((p) => p.title)).toContain('Quán Cafe An Nhiên');
  });

  it('xem chi tiết theo slug: có chủ cửa hàng mẫu và số liệu', async () => {
    const r = await get<Detail>('/places/quan-cafe-an-nhien');
    expect(r.data.title).toBe('Quán Cafe An Nhiên');
    expect(r.data.owner?.displayName).toBe('Lan Anh');
    expect(r.data.wishCount).toBe(12500);
    expect(r.data.coverUrl).toBeTruthy();
  });

  it('điểm không tồn tại trả mã không tìm thấy', async () => {
    const r = await get('/places/khong-ton-tai');
    expect(r.status).toBe(404);
    expect(r.error?.code).toBe('PLACE_NOT_FOUND');
  });

  it('ghi nhận lượt ghé thăm (khách được phép)', async () => {
    const a = await get<Detail>('/places/quan-cafe-an-nhien');
    const v = await post('/places/quan-cafe-an-nhien/visits', {}, { ip: freshIp() });
    expect(v.status).toBeLessThan(300);
    const b = await get<{ visitCount: number }>('/places/quan-cafe-an-nhien');
    expect(b.data.visitCount).toBeGreaterThanOrEqual((a.data as unknown as { visitCount: number }).visitCount);
  });

  it('ghé ngẫu nhiên trả về một điểm', async () => {
    const r = await get<PlaceRow>('/places/random');
    expect(r.data.id).toBeTruthy();
  });
});

describe('bảng xếp hạng tuần của cửa hàng / sale', () => {
  it('Cửa hàng xếp theo số vía nhận trong tuần, giảm dần', async () => {
    const r = await get<Board>('/places/leaderboard?kind=store&limit=5');
    expect(r.data.items.length).toBeGreaterThanOrEqual(3);
    expect(r.data.items[0]?.place.title).toBe('Quán Cafe An Nhiên');
    const counts = r.data.items.map((i) => i.wishes);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
    expect(r.data.items.map((i) => i.rank)).toEqual(r.data.items.map((_, i) => i + 1));
    expect(r.data.items.every((i) => i.place.kind === 'store')).toBe(true);
  });

  it('Sale chỉ gồm văn phòng sale', async () => {
    const r = await get<Board>('/places/leaderboard?kind=sale_office');
    expect(r.data.items.length).toBeGreaterThan(0);
    expect(r.data.items.every((i) => i.place.kind === 'sale_office')).toBe(true);
  });

  it('chu kỳ bắt đầu vào thứ Hai 00:00 giờ Việt Nam', async () => {
    const r = await get<Board>('/places/leaderboard?kind=store');
    const start = new Date(new Date(r.data.weekStartsAt).getTime() + 7 * 3600_000);
    expect(start.getUTCDay()).toBe(1);
    expect(start.getUTCHours()).toBe(0);
    expect(start.getUTCMinutes()).toBe(0);
  });

  it('một lượt gửi vía mới tăng số vía của cửa hàng trong tuần', async () => {
    const before = await get<Board>('/places/leaderboard?kind=store&limit=10');
    const target = before.data.items[before.data.items.length - 1];
    if (!target) throw new Error('bảng xếp hạng trống');
    const cat = await catalog();
    await post(`/places/${target.place.id}/wishes`, { wishTypeId: cat.wishTypes[0]?.id }, { ip: freshIp() });
    const after = await get<Board>('/places/leaderboard?kind=store&limit=10');
    expect(after.data.items.find((i) => i.place.id === target.place.id)?.wishes).toBe(target.wishes + 1);
  });
});

describe('tạo và quản lý cửa hàng của thành viên', () => {
  it('tạo cửa hàng yêu cầu đăng nhập', async () => {
    const cat = await catalog();
    const r = await post('/places', { kind: 'store', title: 'Tiệm thử', categoryId: cat.categories[0]?.id, sceneTemplateId: cat.sceneTemplates[0]?.id }, { ip: freshIp() });
    expect(r.status).toBe(401);
    expect(r.error?.code).toBe('AUTH_REQUIRED');
  });

  it('thành viên tạo, sửa và xóa cửa hàng của mình; người khác không sửa được', async () => {
    const owner = await login();
    const other = await login();
    const cat = await catalog();
    const store = cat.categories.find((c) => c.kind === 'store');
    const tpl = cat.sceneTemplates.find((t) => t.kind === 'store');
    const created = await post<Detail>('/places', { kind: 'store', title: 'Tiệm của tôi', categoryId: store?.id, sceneTemplateId: tpl?.id, autoReplyEnabled: true }, { token: owner.token });
    expect(created.status).toBe(201);
    expect(created.code).toBe('PLACE_CREATED');
    expect(created.data.isDemo).toBe(false);

    const mine = await get<PlaceRow[]>('/places/mine', { token: owner.token });
    expect(mine.data.map((p) => p.id)).toContain(created.data.id);

    const forbidden = await patch(`/places/${created.data.id}`, { title: 'Hack' }, { token: other.token });
    expect(forbidden.status).toBeGreaterThanOrEqual(400);

    const upd = await patch<Detail>(`/places/${created.data.id}`, { title: 'Tiệm đổi tên', tagline: 'Mới' }, { token: owner.token });
    expect(upd.status).toBeLessThan(300);
    const check = await get<Detail>(`/places/${created.data.slug}`);
    expect(check.data.title).toBe('Tiệm đổi tên');

    const removed = await del(`/places/${created.data.id}`, { token: owner.token });
    expect(removed.status).toBeLessThan(300);
    expect((await get(`/places/${created.data.slug}`)).status).toBe(404);
  });

  it('thích và theo dõi cửa hàng cập nhật bộ đếm, không cộng dồn khi bấm lặp', async () => {
    const s = await login();
    const before = await get<Detail>('/places/quan-cafe-an-nhien');
    const id = before.data.id;
    await put(`/places/${id}/like`, {}, { token: s.token });
    await put(`/places/${id}/like`, {}, { token: s.token });
    const liked = await get<Detail>('/places/quan-cafe-an-nhien', { token: s.token });
    expect(liked.data.likeCount).toBe(before.data.likeCount + 1);
    expect(liked.data.viewer?.liked).toBe(true);
    await del(`/places/${id}/like`, { token: s.token });
    const unliked = await get<Detail>('/places/quan-cafe-an-nhien', { token: s.token });
    expect(unliked.data.likeCount).toBe(before.data.likeCount);

    await put(`/places/${id}/follow`, {}, { token: s.token });
    const following = await get<Detail>('/places/quan-cafe-an-nhien', { token: s.token });
    expect(following.data.viewer?.following).toBe(true);
    expect(following.data.followCount).toBe(before.data.followCount + 1);
  });

  it('khách không thích/theo dõi được', async () => {
    const r = await put('/places/quan-cafe-an-nhien/like', {});
    expect(r.status).toBe(401);
  });
});

describe('công tắc "Hiện dữ liệu mẫu"', () => {
  it('tắt công tắc: cửa hàng mẫu và bảng xếp hạng biến mất; bật lại thì trở về', async () => {
    const admin = await adminLogin();
    const settings = (await get<Record<string, unknown>>('/admin/settings', { token: admin.token })).data;
    try {
      const off = await put('/admin/settings', { ...settings, showDemoData: false }, { token: admin.token });
      expect(off.status).toBe(200);
      expect((await get<PlaceRow[]>('/places')).data.filter((p) => p.isDemo)).toHaveLength(0);
      expect((await get<Board>('/places/leaderboard?kind=store')).data.items.filter((row) => row.place.isDemo)).toHaveLength(0);
      const posts = await get<{ author: { displayName: string } }[]>('/posts?pageSize=50');
      expect(posts.data.some((p) => p.author.displayName === 'Lan Anh')).toBe(false);
    } finally {
      await put('/admin/settings', { ...settings, showDemoData: true }, { token: admin.token });
    }
    expect((await get<PlaceRow[]>('/places')).data.length).toBeGreaterThanOrEqual(6);
  });
});
