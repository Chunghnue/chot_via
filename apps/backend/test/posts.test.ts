import { describe, expect, it } from 'vitest';
import postgres from 'postgres';
import { adminLogin, catalog, del, freshIp, get, login, post, put } from './support/api';

interface PostRow {
  id: string;
  type: string;
  role: string | null;
  body: string;
  hashtags: string[];
  pinned: boolean;
  media: unknown[];
  poll: { options: { id: string; votes: number }[] } | null;
  author: { displayName: string; jobTitle: string | null };
  counts: { reactions: number; comments: number; shares: number };
  achievement: { displayMode: string; amount: number | null } | null;
  viewer: { reaction: string | null; saved: boolean } | null;
}

describe('bảng tin', () => {
  it('khách đọc được bảng tin chung; Kể khổ và Khoe xen kẽ trong cùng một feed', async () => {
    const r = await get<PostRow[]>('/posts?pageSize=50');
    expect(r.status).toBe(200);
    const types = new Set(r.data.map((p) => p.type));
    expect(types.has('story')).toBe(true);
    expect(types.has('achievement')).toBe(true);
  });

  it('bộ lọc Kể khổ / Khoe doanh thu / Khoe deal', async () => {
    const story = await get<PostRow[]>('/posts?type=story&pageSize=50');
    expect(story.data.length).toBeGreaterThan(0);
    expect(story.data.every((p) => p.type === 'story')).toBe(true);
    const revenue = await get<PostRow[]>('/posts?type=revenue&pageSize=50');
    expect(revenue.data.every((p) => p.type === 'achievement' && p.role === 'owner')).toBe(true);
    const deal = await get<PostRow[]>('/posts?type=deal&pageSize=50');
    expect(deal.data.length).toBeGreaterThan(0);
    expect(deal.data.every((p) => p.type === 'achievement' && p.role === 'sale')).toBe(true);
  });

  it('bài ghim xếp đầu khi pinned=first', async () => {
    const r = await get<PostRow[]>('/posts?pinned=first&pageSize=20');
    const firstUnpinned = r.data.findIndex((p) => !p.pinned);
    expect(r.data.slice(0, 4).every((p) => p.pinned)).toBe(true);
    expect(r.data.slice(firstUnpinned).every((p) => !p.pinned)).toBe(true);
  });

  it('lọc bài có ảnh và có bình chọn', async () => {
    const photo = await get<PostRow[]>('/posts?has=photo&pageSize=50');
    expect(photo.data.length).toBeGreaterThan(0);
    expect(photo.data.every((p) => p.media.length > 0)).toBe(true);
    const poll = await get<PostRow[]>('/posts?has=poll&pageSize=50');
    expect(poll.data.length).toBeGreaterThan(0);
    expect(poll.data.every((p) => p.poll !== null)).toBe(true);
  });

  it('sắp xếp "đang được quan tâm" khác "mới nhất"', async () => {
    const hot = await get<PostRow[]>('/posts?type=story&sort=hot&pageSize=3');
    const fresh = await get<PostRow[]>('/posts?type=story&sort=new&pageSize=3');
    expect(hot.data.map((p) => p.id)).not.toEqual(fresh.data.map((p) => p.id));
  });

  it('chức danh tác giả hiển thị cùng bài (dữ liệu mẫu)', async () => {
    const r = await get<PostRow[]>('/posts?pageSize=50');
    expect(r.data.find((p) => p.author.displayName === 'Lan Anh')?.author.jobTitle).toBe('Chủ quán Café');
  });

  it('chủ đề hot do admin cấu hình, bình chọn vui và top Kể Khổ tuần', async () => {
    const topics = await get<{ title: string }[]>('/topics/hot');
    expect(topics.data.length).toBe(5);
    const poll = await get<PostRow | null>('/posts/featured-poll');
    expect(poll.data?.poll?.options).toHaveLength(3);
    const top = await get<{ rank: number; hearts: number; user: { displayName: string } }[]>('/posts/top-story-authors');
    expect(top.data.map((t) => t.rank)).toEqual([1, 2, 3]);
    expect(top.data[0]?.hearts).toBeGreaterThanOrEqual(top.data[1]?.hearts ?? 0);
  });
});

describe('đăng bài', () => {
  it('khách không đăng được (yêu cầu đăng nhập đúng lúc)', async () => {
    const r = await post('/posts', { type: 'story', body: 'xin chào' });
    expect(r.status).toBe(401);
    expect(r.error?.code).toBe('AUTH_REQUIRED');
  });

  it('thành viên đăng Kể khổ có hashtag và cảm xúc; xuất hiện trên bảng tin', async () => {
    const s = await login();
    const text = `Kể khổ thử nghiệm ${Date.now()}`;
    const r = await post<PostRow>('/posts', { type: 'story', body: text, hashtags: ['thunghiem'], sticker: '😂' }, { token: s.token });
    expect(r.status).toBe(201);
    expect(r.code).toBe('POST_CREATED');
    expect(r.data.hashtags).toEqual(['thunghiem']);
    const feed = await get<PostRow[]>('/posts?hashtag=thunghiem');
    expect(feed.data.map((p) => p.id)).toContain(r.data.id);
  });

  it('Khoe: mặc định ẩn số tiền; chỉ số phải đúng vai trò', async () => {
    const s = await login();
    const ok = await post<PostRow>('/posts', { type: 'achievement', body: 'Ngày bán tốt', role: 'owner', metricType: 'revenue' }, { token: s.token });
    expect(ok.status).toBe(201);
    expect(ok.data.achievement).toMatchObject({ displayMode: 'hidden', amount: null });
    const wrong = await post('/posts', { type: 'achievement', body: 'Sai vai trò', role: 'owner', metricType: 'deal' }, { token: s.token });
    expect(wrong.status).toBeGreaterThanOrEqual(400);
    expect(wrong.error?.code).toBeTruthy();
  });

  it('hiện số tiền cụ thể chỉ khi người đăng chủ động chọn', async () => {
    const s = await login();
    const r = await post<PostRow>('/posts', { type: 'achievement', body: 'Chốt deal', role: 'sale', metricType: 'deal', displayMode: 'exact', amount: 800_000_000 }, { token: s.token });
    expect(r.data.achievement).toMatchObject({ displayMode: 'exact', amount: 800_000_000 });
  });

  it('bài có bình chọn: bỏ phiếu được tính đúng, mỗi người một phiếu', async () => {
    const s = await login();
    const p = await post<PostRow>('/posts', { type: 'story', body: 'Chọn giúp mình', poll: { options: ['A', 'B'] } }, { token: s.token });
    const optionId = p.data.poll?.options[0]?.id ?? '';
    const v1 = await post<{ options: { id: string; votes: number }[]; totalVotes: number }>(`/posts/${p.data.id}/poll/vote`, { optionId }, { token: s.token });
    expect(v1.data.totalVotes).toBe(1);
    const v2 = await post<{ totalVotes: number }>(`/posts/${p.data.id}/poll/vote`, { optionId }, { token: s.token });
    expect(v2.data.totalVotes).toBe(1);
  });

  it('từ khóa chặn do admin cấu hình làm bài bị từ chối', async () => {
    const admin = await adminLogin();
    const s = await login();
    const kw = await post<{ id: string }>('/admin/catalog/keywords', { keyword: 'tuvungcamtest', action: 'block' }, { token: admin.token });
    expect(kw.status).toBeLessThan(300);
    const r = await post('/posts', { type: 'story', body: 'nội dung có tuvungcamtest ở đây' }, { token: s.token });
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(r.error?.code).toBeTruthy();
    await del(`/admin/catalog/keywords/${kw.data.id}`, { token: admin.token });
  });

  it('xóa bài: chỉ chủ bài được xóa', async () => {
    const a = await login();
    const b = await login();
    const p = await post<PostRow>('/posts', { type: 'story', body: 'Bài sẽ xóa' }, { token: a.token });
    expect((await del(`/posts/${p.data.id}`, { token: b.token })).status).toBeGreaterThanOrEqual(400);
    expect((await del(`/posts/${p.data.id}`, { token: a.token })).status).toBeLessThan(300);
  });
});

describe('tương tác', () => {
  it('thả cảm xúc, bỏ cảm xúc, lưu bài, bình luận, chia sẻ', async () => {
    const s = await login();
    const p = (await get<PostRow[]>('/posts?type=story&pageSize=1')).data[0];
    if (!p) throw new Error('không có bài');
    const react = await put<{ reactions: number; mine: string }>(`/posts/${p.id}/reaction`, { type: 'love' }, { token: s.token });
    expect(react.data.mine).toBe('love');
    expect(react.data.reactions).toBe(p.counts.reactions + 1);
    const unreact = await del<{ mine: string | null }>(`/posts/${p.id}/reaction`, { token: s.token });
    expect(unreact.data.mine).toBeNull();

    await put(`/posts/${p.id}/save`, {}, { token: s.token });
    const saved = await get<PostRow[]>('/me/saved-posts', { token: s.token });
    expect(saved.data.map((x) => x.id)).toContain(p.id);

    const c = await post(`/posts/${p.id}/comments`, { body: 'Đồng cảm quá!' }, { token: s.token });
    expect(c.status).toBe(201);
    const list = await get<{ body: string }[]>(`/posts/${p.id}/comments`);
    expect(list.data.map((x) => x.body)).toContain('Đồng cảm quá!');

    const share = await post<{ shares: number }>(`/posts/${p.id}/share`, {}, { ip: freshIp() });
    expect(share.data.shares).toBe(p.counts.shares + 1);
  });

  it('khách không thả cảm xúc/bình luận (cần đăng nhập)', async () => {
    const p = (await get<PostRow[]>('/posts?pageSize=1')).data[0];
    expect((await put(`/posts/${p?.id}/reaction`, { type: 'like' })).status).toBe(401);
    expect((await post(`/posts/${p?.id}/comments`, { body: 'x' })).status).toBe(401);
  });

  it('gửi vía động viên cho bài viết: khách được, bộ đếm tăng', async () => {
    const cat = await catalog();
    const p = (await get<PostRow[]>('/posts?type=story&pageSize=1')).data[0];
    const r = await post<{ wishes: number }>(`/posts/${p?.id}/wishes`, { wishTypeId: cat.wishTypes[0]?.id }, { ip: freshIp() });
    expect(r.status).toBeLessThan(300);
    expect(r.data.wishes).toBeGreaterThan(0);
  });
});

describe('báo cáo & kiểm duyệt', () => {
  it('khách được báo cáo bài; thành viên xem lại báo cáo của mình', async () => {
    const p = (await get<PostRow[]>('/posts?pageSize=1')).data[0];
    const guest = await post('/reports', { targetType: 'post', targetId: p?.id, reason: 'spam' }, { ip: freshIp() });
    expect(guest.status).toBeLessThan(300);
    const s = await login();
    const mine = await post('/reports', { targetType: 'post', targetId: p?.id, reason: 'scam', detail: 'Nghi lừa đảo' }, { token: s.token, ip: freshIp() });
    expect(mine.status).toBeLessThan(300);
    const list = await get<{ reason: string; state: string }[]>('/me/reports', { token: s.token });
    expect(list.data[0]).toMatchObject({ reason: 'scam', state: 'pending' });
  });

  it('lý do báo cáo ngoài danh sách 7 lý do bị từ chối', async () => {
    const p = (await get<PostRow[]>('/posts?pageSize=1')).data[0];
    const r = await post('/reports', { targetType: 'post', targetId: p?.id, reason: 'khac-la' }, { ip: freshIp() });
    expect(r.status).toBe(400);
  });
});

describe('điểm từ tương tác bài viết (quyết định 26/11/2026)', () => {
  interface Stats { points: number; engagement: { today: number; cap: number } }
  interface Reacted { reactions: number; mine: string | null; reactionCounts: { like: number; love: number; haha: number } }
  interface Wished { wishes: number; wishBreakdown: { wishTypeId: string; count: number; mine: boolean }[] }
  const stats = async (token: string): Promise<Stats> => (await get<Stats>('/me/stats', { token })).data;
  const newPost = async (token: string): Promise<string> => (await post<PostRow>('/posts', { type: 'story', body: `Điểm tương tác ${Date.now()}`, hashtags: [], sticker: null }, { token })).data.id;

  it('mỗi người khác chỉ mang lại tối đa +1 điểm cho chủ bài, bất kể loại hay số lần; chủ bài tự tương tác +0', async () => {
    const author = await login(); const b = await login(); const c = await login();
    const cat = await catalog();
    const pid = await newPost(author.token);
    const before = await stats(author.token);

    await put(`/posts/${pid}/reaction`, { type: 'love' }, { token: author.token });
    await post(`/posts/${pid}/wishes`, { wishTypeId: cat.wishTypes[0]?.id }, { token: author.token });
    expect((await stats(author.token)).points).toBe(before.points);

    await put(`/posts/${pid}/reaction`, { type: 'love' }, { token: b.token });
    expect((await stats(author.token)).points).toBe(before.points + 1);

    await put(`/posts/${pid}/reaction`, { type: 'haha' }, { token: b.token });
    await post(`/posts/${pid}/wishes`, { wishTypeId: cat.wishTypes[0]?.id }, { token: b.token });
    await post(`/posts/${pid}/wishes`, { wishTypeId: cat.wishTypes[1]?.id }, { token: b.token });
    await del(`/posts/${pid}/reaction`, { token: b.token });
    await put(`/posts/${pid}/reaction`, { type: 'like' }, { token: b.token });
    expect((await stats(author.token)).points).toBe(before.points + 1);

    await post(`/posts/${pid}/wishes`, { wishTypeId: cat.wishTypes[2]?.id }, { token: c.token });
    const after = await stats(author.token);
    expect(after.points).toBe(before.points + 2);
    expect(after.engagement.today - before.engagement.today).toBe(2);
    expect((await stats(b.token)).points).toBe(0);
  });

  it('người tương tác không được điểm; lượt vẫn đếm đủ theo từng loại cảm xúc và từng loại vía', async () => {
    const author = await login(); const b = await login(); const c = await login();
    const cat = await catalog();
    const pid = await newPost(author.token);
    const r1 = await put<Reacted>(`/posts/${pid}/reaction`, { type: 'like' }, { token: b.token });
    expect(r1.data.reactionCounts).toEqual({ like: 1, love: 0, haha: 0 });
    const r2 = await put<Reacted>(`/posts/${pid}/reaction`, { type: 'haha' }, { token: b.token });
    expect(r2.data.reactionCounts).toEqual({ like: 0, love: 0, haha: 1 });
    const r3 = await put<Reacted>(`/posts/${pid}/reaction`, { type: 'haha' }, { token: c.token });
    expect(r3.data.reactionCounts.haha).toBe(2);
    const w = await post<Wished>(`/posts/${pid}/wishes`, { wishTypeId: cat.wishTypes[0]?.id }, { token: b.token });
    const again = await post<Wished>(`/posts/${pid}/wishes`, { wishTypeId: cat.wishTypes[0]?.id }, { token: b.token });
    expect(again.data.wishes).toBe(w.data.wishes);
    expect(w.data.wishBreakdown.find((x) => x.wishTypeId === cat.wishTypes[0]?.id)).toMatchObject({ count: 1, mine: true });
    expect((await stats(b.token)).engagement.today).toBe(0);
  });

  it('trần 50 điểm/ngày: chạm trần thì tương tác vẫn hoạt động và đếm lượt nhưng không thêm điểm', async () => {
    const author = await login(); const x = await login(); const y = await login();
    const pid = await newPost(author.token);
    const sql = postgres('postgres://chotvia:chotvia@localhost:5432/chotvia_test', { max: 1 });
    try {
      // Dựng sẵn 49 điểm tương tác hôm nay: ghép nhiều bài với nhiều người (mỗi cặp bài-người một dòng).
      const others = await sql<{ id: string }[]>`select id from users where id <> ${author.userId} and id not in (${x.userId}, ${y.userId}) limit 30`;
      const posts = await sql<{ id: string }[]>`select id from posts where author_id <> ${author.userId} limit 3`;
      let made = 0;
      for (const pp of posts) for (const u of others) {
        if (made >= 49) break;
        await sql`insert into point_ledger (user_id, action, points, source_post_id, source_actor_id) values (${author.userId}, 'post_engagement', 1, ${pp.id}, ${u.id}) on conflict do nothing`;
        made++;
      }
      expect(made).toBe(49);
      const filled = (await sql<{ s: number }[]>`select coalesce(sum(points),0)::int s from point_ledger where user_id = ${author.userId} and action = 'post_engagement'`)[0]?.s ?? 0;
      const need = 50 - filled;
      expect(need).toBeGreaterThanOrEqual(0);
      const base = (await stats(author.token)).points;

      await put(`/posts/${pid}/reaction`, { type: 'like' }, { token: x.token });
      const mid = await stats(author.token);
      expect(mid.engagement.today).toBe(Math.min(50, filled + 1));
      await put(`/posts/${pid}/reaction`, { type: 'love' }, { token: y.token });
      const full = await stats(author.token);
      expect(full.engagement).toEqual({ today: 50, cap: 50 });
      const last = await put<Reacted>(`/posts/${pid}/reaction`, { type: 'haha' }, { token: (await login()).token });
      expect(last.status).toBe(200);
      expect(last.data.reactions).toBe(3);
      expect((await stats(author.token)).engagement.today).toBe(50);
      expect((await stats(author.token)).points).toBeLessThanOrEqual(base + 2);
    } finally { await sql.end(); }
  });
});
