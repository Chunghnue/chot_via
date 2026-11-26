import { describe, expect, it } from 'vitest';
import { adminLogin, del, freshIp, get, login, patch, post, put } from './support/api';

interface Item { id: string }
interface DemoUser extends Item { displayName: string; status: string; memberRole: string | null }
interface DemoPost extends Item { body: string; pinned: boolean; authorName: string; reactionCount: number }

describe('phân quyền quản trị', () => {
  it('khách và thành viên thường không vào được API admin', async () => {
    expect((await get('/admin/stats')).status).toBe(401);
    const s = await login();
    const r = await get('/admin/stats', { token: s.token });
    expect(r.status).toBe(403);
    expect(r.error?.code).toBe('COMMON_FORBIDDEN');
  });

  it('admin xem được thống kê tổng quan', async () => {
    const a = await adminLogin();
    const r = await get<{ members: number; postsTotal: number; placesTotal: number }>('/admin/stats', { token: a.token });
    expect(r.status).toBe(200);
    expect(r.data.postsTotal).toBeGreaterThan(0);
    expect(r.data.placesTotal).toBeGreaterThanOrEqual(6);
  });
});

describe('danh mục cấu hình (CRUD chung)', () => {
  it('chủ đề hot: tạo, sửa, hiện ở app, xóa', async () => {
    const a = await adminLogin();
    const c = await post<Item>('/admin/catalog/hot-topics', { title: 'Chủ đề thử nghiệm', hashtag: 'thunghiem', sortOrder: 99, active: true }, { token: a.token });
    expect(c.status).toBeLessThan(300);
    expect((await get<{ title: string }[]>('/topics/hot')).data.map((t) => t.title)).toContain('Chủ đề thử nghiệm');
    const u = await put(`/admin/catalog/hot-topics/${c.data.id}`, { title: 'Đổi tên', hashtag: null, sortOrder: 99, active: false }, { token: a.token });
    expect(u.status).toBeLessThan(300);
    expect((await get<{ title: string }[]>('/topics/hot')).data.map((t) => t.title)).not.toContain('Đổi tên');
    expect((await del(`/admin/catalog/hot-topics/${c.data.id}`, { token: a.token })).status).toBeLessThan(300);
  });

  it('dữ liệu sai bị chặn bằng mã xác thực; tài nguyên lạ trả không tìm thấy', async () => {
    const a = await adminLogin();
    expect((await post('/admin/catalog/hot-topics', { title: 'x' }, { token: a.token })).status).toBe(400);
    expect((await get('/admin/catalog/khong-co', { token: a.token })).status).toBeGreaterThanOrEqual(400);
  });

  it('liệt kê đủ các danh mục: loại vía, mẫu lời chúc, nhiệm vụ, thử thách, sự kiện', async () => {
    const a = await adminLogin();
    for (const key of ['wish-types', 'wish-templates', 'place-categories', 'scene-templates', 'missions', 'challenges', 'events', 'levels', 'badges', 'keywords', 'hot-topics']) {
      const r = await get<unknown[]>(`/admin/catalog/${key}`, { token: a.token });
      expect(r.status, key).toBe(200);
      expect(Array.isArray(r.data), key).toBe(true);
    }
  });

  it('nhiệm vụ mẫu không có điểm thưởng', async () => {
    const a = await adminLogin();
    const r = await get<Record<string, unknown>[]>('/admin/catalog/missions', { token: a.token });
    expect(r.data.every((m) => !('points' in m) && !('reward' in m))).toBe(true);
  });
});

describe('tài khoản mẫu và bài mẫu', () => {
  it('tạo, khóa, sửa, xóa tài khoản mẫu', async () => {
    const a = await adminLogin();
    const input = { displayName: 'Chủ quán thử', memberRole: 'owner', jobTitle: 'Chủ tiệm', province: 'Huế', avatarUrl: null, status: 'active' };
    const c = await post<DemoUser>('/admin/demo/users', input, { token: a.token });
    expect(c.status).toBe(201);
    expect((await get<DemoUser[]>('/admin/demo/users', { token: a.token })).data.map((u) => u.displayName)).toContain('Chủ quán thử');
    expect((await put(`/admin/demo/users/${c.data.id}`, { ...input, status: 'banned' }, { token: a.token })).status).toBeLessThan(300);
    expect((await get<DemoUser[]>('/admin/demo/users', { token: a.token })).data.find((u) => u.id === c.data.id)?.status).toBe('banned');
    expect((await del(`/admin/demo/users/${c.data.id}`, { token: a.token })).status).toBeLessThan(300);
  });

  it('chỉ thao tác được trên dữ liệu mẫu, không đụng người dùng thật', async () => {
    const a = await adminLogin();
    const real = await login();
    const r = await del(`/admin/demo/users/${real.userId}`, { token: a.token });
    expect(r.status).toBe(404);
  });

  it('bài mẫu: tạo (có ghim), hiện trên trang chủ, sửa, xóa', async () => {
    const a = await adminLogin();
    const users = await get<DemoUser[]>('/admin/demo/users', { token: a.token });
    const author = users.data.find((u) => u.displayName === 'Tuấn Anh') ?? users.data[0];
    const body = {
      authorId: author?.id,
      type: 'story',
      body: `Bài mẫu thử ${Date.now()}`,
      hashtags: ['thu'],
      imageUrl: null,
      pinned: true,
      reactionCount: 9999,
      commentCount: 3,
      shareCount: 2,
      hoursAgo: 0.1,
    };
    expect((await post('/admin/demo/posts', body, { token: a.token })).status).toBe(201);
    const list = await get<DemoPost[]>('/admin/demo/posts', { token: a.token });
    const mine = list.data.find((p) => p.body === body.body);
    expect(mine?.pinned).toBe(true);
    const feed = await get<{ body: string; pinned: boolean }[]>('/posts?pinned=first&pageSize=5');
    expect(feed.data.map((p) => p.body)).toContain(body.body);
    expect((await put(`/admin/demo/posts/${mine?.id}`, { ...body, pinned: false, body: `${body.body} (sửa)` }, { token: a.token })).status).toBeLessThan(300);
    expect((await del(`/admin/demo/posts/${mine?.id}`, { token: a.token })).status).toBeLessThan(300);
  });

  it('admin ghim và bỏ ghim bài thật qua PATCH', async () => {
    const a = await adminLogin();
    const s = await login();
    const p = await post<{ id: string }>('/posts', { type: 'story', body: 'Bài để ghim' }, { token: s.token });
    expect((await patch(`/admin/posts/${p.data.id}`, { pinned: true }, { token: a.token })).status).toBeLessThan(300);
    expect((await get<{ id: string; pinned: boolean }[]>('/posts?pinned=first&pageSize=10')).data.find((x) => x.id === p.data.id)?.pinned).toBe(true);
    expect((await patch(`/admin/posts/${p.data.id}`, { pinned: false }, { token: a.token })).status).toBeLessThan(300);
    expect((await patch(`/admin/posts/${p.data.id}`, {}, { token: a.token })).status).toBe(400);
  });

  it('gỡ bài: bài biến mất khỏi bảng tin công khai', async () => {
    const a = await adminLogin();
    const s = await login();
    const p = await post<{ id: string }>('/posts', { type: 'story', body: 'Bài sẽ bị gỡ' }, { token: s.token });
    await patch(`/admin/posts/${p.data.id}`, { status: 'removed' }, { token: a.token });
    expect((await get<{ id: string }[]>('/posts?pageSize=50')).data.map((x) => x.id)).not.toContain(p.data.id);
  });
});

describe('xử lý báo cáo', () => {
  it('moderator/admin thấy báo cáo chờ xử lý và xử lý được', async () => {
    const a = await adminLogin();
    const p = (await get<{ id: string }[]>('/posts?pageSize=1')).data[0];
    await post('/reports', { targetType: 'post', targetId: p?.id, reason: 'offensive' }, { ip: freshIp() });
    const list = await get<{ id: string; state: string }[]>('/admin/reports?state=pending', { token: a.token });
    expect(list.data.length).toBeGreaterThan(0);
    const done = await patch(`/admin/reports/${list.data[0]?.id}`, { action: 'dismiss' }, { token: a.token });
    expect(done.status).toBeLessThan(300);
  });
});

describe('cài đặt hệ thống', () => {
  it('đọc và lưu cài đặt; giá trị sai bị chặn', async () => {
    const a = await adminLogin();
    const s = (await get<Record<string, unknown>>('/admin/settings', { token: a.token })).data;
    expect(s).toMatchObject({ showDemoData: true, leaderboard: { maxMembers: 100, defaultVisible: 5 } });
    expect((await put('/admin/settings', { ...s, storyMaxChars: 10 }, { token: a.token })).status).toBe(400);
    expect((await put('/admin/settings', s, { token: a.token })).status).toBe(200);
  });
});
