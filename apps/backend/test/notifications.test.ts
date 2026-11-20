import { describe, expect, it } from 'vitest';
import { catalog, freshIp, get, login, post, put } from './support/api';

interface NotifList { items: { id: string; type: string; readAt: string | null; params: Record<string, string> }[]; unread: number }
interface Detail { id: string; slug: string }

async function setup() {
  const owner = await login();
  const other = await login();
  const p = await post<{ id: string }>('/posts', { type: 'story', body: 'Bài để nhận thông báo' }, { token: owner.token });
  return { owner, other, postId: p.data.id };
}
const list = (token: string) => get<NotifList>('/me/notifications', { token });

describe('thông báo (chuông)', () => {
  it('khách không có thông báo; thành viên mới chưa có gì', async () => {
    expect((await get('/me/notifications')).status).toBe(401);
    const s = await login();
    const r = await list(s.token);
    expect(r.data).toEqual({ items: [], unread: 0 });
  });

  it('bình luận, thả cảm xúc, theo dõi và nhận vía tạo thông báo cho đúng người', async () => {
    const { owner, other, postId } = await setup();
    await post(`/posts/${postId}/comments`, { body: 'Hay quá' }, { token: other.token });
    await put(`/posts/${postId}/reaction`, { type: 'love' }, { token: other.token });
    await put(`/users/${owner.userId}/follow`, {}, { token: other.token });

    const cat = await catalog();
    const place = await post<Detail>('/places', { kind: 'store', title: 'Tiệm nhận vía', categoryId: cat.categories.find((c) => c.kind === 'store')?.id, sceneTemplateId: cat.sceneTemplates.find((t) => t.kind === 'store')?.id, autoReplyEnabled: true }, { token: owner.token });
    await post(`/places/${place.data.id}/wishes`, { wishTypeId: cat.wishTypes[0]?.id }, { token: other.token, ip: freshIp() });

    const r = await list(owner.token);
    const types = r.data.items.map((n) => n.type).sort();
    expect(types).toEqual(['new_follower', 'place_wished', 'post_commented', 'post_reacted']);
    expect(r.data.unread).toBe(4);
    expect(r.data.items.every((n) => n.readAt === null)).toBe(true);
    // người gây ra thông báo không tự nhận thông báo của mình
    expect((await list(other.token)).data.items).toHaveLength(0);
  });

  it('thông báo chỉ chứa mã và tham số, không có chữ hiển thị', async () => {
    const { owner, other, postId } = await setup();
    await post(`/posts/${postId}/comments`, { body: 'Đồng cảm' }, { token: other.token });
    const n = (await list(owner.token)).data.items[0];
    expect(n?.type).toBe('post_commented');
    expect(Object.keys(n?.params ?? {}).sort()).toEqual(['actorName', 'postId']);
  });

  it('đánh dấu đã đọc từng thông báo: số chưa đọc giảm đúng một', async () => {
    const { owner, other, postId } = await setup();
    await post(`/posts/${postId}/comments`, { body: 'Một' }, { token: other.token });
    await put(`/posts/${postId}/reaction`, { type: 'like' }, { token: other.token });
    const before = await list(owner.token);
    expect(before.data.unread).toBe(2);
    const target = before.data.items[0];
    const r = await post('/me/notifications/read', { ids: [target?.id] }, { token: owner.token });
    expect(r.status).toBeLessThan(300);
    const after = await list(owner.token);
    expect(after.data.unread).toBe(1);
    expect(after.data.items.find((n) => n.id === target?.id)?.readAt).not.toBeNull();
  });

  it('không đánh dấu được thông báo của người khác', async () => {
    const { owner, other, postId } = await setup();
    await post(`/posts/${postId}/comments`, { body: 'Chéo' }, { token: other.token });
    const mine = (await list(owner.token)).data.items[0];
    await post('/me/notifications/read', { ids: [mine?.id] }, { token: other.token });
    expect((await list(owner.token)).data.unread).toBe(1);
  });

  it('"Đánh dấu đã đọc" tất cả đưa số chưa đọc về 0; id sai định dạng bị từ chối', async () => {
    const { owner, other, postId } = await setup();
    await post(`/posts/${postId}/comments`, { body: 'A' }, { token: other.token });
    await post(`/posts/${postId}/comments`, { body: 'B' }, { token: other.token });
    expect((await list(owner.token)).data.unread).toBe(2);
    expect((await post('/me/notifications/read', { ids: ['khong-phai-uuid'] }, { token: owner.token })).status).toBe(400);
    expect((await post('/me/notifications/read', {}, { token: owner.token })).status).toBeLessThan(300);
    expect((await list(owner.token)).data.unread).toBe(0);
  });

  it('admin gỡ bài thì tác giả nhận thông báo post_removed', async () => {
    const { owner, postId } = await setup();
    const { adminLogin, patch } = await import('./support/api');
    const admin = await adminLogin();
    await patch(`/admin/posts/${postId}`, { status: 'removed' }, { token: admin.token });
    expect((await list(owner.token)).data.items.map((n) => n.type)).toContain('post_removed');
  });
});
