import { describe, expect, it } from 'vitest';
import { freshIp, get, login, post } from './support/api';

interface Board { items: { rank: number; points: number; user: { displayName: string } }[]; total: number; me: { rank: number | null; points: number } | null }

describe('bảng xếp hạng thành viên theo điểm vía', () => {
  it('mặc định hiện 5, tối đa 100, xếp giảm dần theo điểm', async () => {
    const r = await get<Board>('/leaderboard');
    expect(r.data.items.length).toBeLessThanOrEqual(5);
    const huge = await get<Board>('/leaderboard?limit=500');
    expect(huge.data.items.length).toBeLessThanOrEqual(100);
    const pts = huge.data.items.map((i) => i.points);
    expect([...pts].sort((a, b) => b - a)).toEqual(pts);
  });

  it('xin vía của thành viên làm điểm tăng và có hạng; khách xem được TOP', async () => {
    const s = await login();
    for (let i = 1; i <= 3; i += 1) await post('/wishes/deity', { sequence: i }, { token: s.token, ip: freshIp() });
    const r = await get<Board>('/leaderboard?limit=100', { token: s.token });
    expect(r.data.me?.points).toBe(3);
    expect(r.data.me?.rank).not.toBeNull();
    const guest = await get<Board>('/leaderboard');
    expect(guest.data.me).toBeNull();
  });

  it('thống kê cá nhân: điểm, số lần xin vía/gửi vía', async () => {
    const s = await login();
    await post('/wishes/deity', { sequence: 1 }, { token: s.token, ip: freshIp() });
    const r = await get<{ points: number; wishCounts: { deity: number; place: number } }>('/me/stats', { token: s.token });
    expect(r.data.points).toBe(1);
    expect(r.data.wishCounts.deity).toBe(1);
  });
});

describe('nhiệm vụ, thử thách, sự kiện', () => {
  it('khách xem được danh sách nhưng chưa có tiến độ', async () => {
    const m = await get<{ progress: number | null; name: string }[]>('/missions');
    expect(m.data.length).toBeGreaterThanOrEqual(3);
    expect(m.data.every((x) => x.progress === null)).toBe(true);
  });

  it('thành viên có tiến độ; làm nhiệm vụ không cộng thêm điểm', async () => {
    const s = await login();
    const before = (await get<{ points: number }>('/me', { token: s.token })).data.points;
    const m = await get<{ progress: number | null; completed: boolean }[]>('/missions', { token: s.token });
    expect(m.data.every((x) => typeof x.progress === 'number')).toBe(true);
    await post('/posts', { type: 'story', body: 'Hoàn thành nhiệm vụ đăng bài' }, { token: s.token });
    expect((await get<{ points: number }>('/me', { token: s.token })).data.points).toBe(before);
  });

  it('thử thách tuần hiện tại và sự kiện đang diễn ra', async () => {
    const c = await get<{ target: number; name: string } | null>('/challenges/current');
    expect(c.data?.target).toBe(3);
    const e = await get<unknown[]>('/events');
    expect(e.data.length).toBeGreaterThanOrEqual(2);
  });
});

describe('trang chủ', () => {
  it('trả các điểm hero và số liệu', async () => {
    const r = await get<{ heroPlaces: { modelKey: string }[]; stats: { members: number } }>('/home');
    expect(r.data.heroPlaces.length).toBeGreaterThanOrEqual(5);
    expect(r.data.heroPlaces.map((p) => p.modelKey)).toEqual(expect.arrayContaining(['cafe', 'fashion', 'minimart', 'sale_office']));
  });
});
