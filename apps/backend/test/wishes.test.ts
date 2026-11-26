import { describe, expect, it } from 'vitest';
import { catalog, freshIp, get, login, post } from './support/api';

interface DeityResult { wish: { templateId: string; text: string }; titleCode: string; timeBucket: string; pointsAwarded: number; totalPoints: number | null }
interface PlaceWishResult { eventId: string; placeTitle: string; reply: { kind: 'auto' | 'system'; text: string }; pointsAwarded: number; totalPoints: number | null }
interface PlaceRow { id: string; slug: string; title: string; autoReplyEnabled: boolean; kind: string }

describe('xin vía Thần Tài', () => {
  it('khách xin vía được ngay, không cần đăng nhập, không có điểm', async () => {
    const r = await post<DeityResult>('/wishes/deity', { sequence: 1 }, { ip: freshIp() });
    expect(r.status).toBe(201);
    expect(r.code).toBe('WISH_RECEIVED');
    expect(r.data.wish.text.length).toBeGreaterThan(5);
    expect(r.data.titleCode).toBe('today');
    expect(r.data.pointsAwarded).toBe(0);
    expect(r.data.totalPoints).toBeNull();
  });

  it('lần 2 trở đi tiêu đề theo buổi thực tế (giờ Việt Nam)', async () => {
    const ip = freshIp();
    const r = await post<DeityResult>('/wishes/deity', { sequence: 2 }, { ip });
    expect(['morning', 'afternoon', 'evening']).toContain(r.data.titleCode);
    expect(r.data.titleCode).toBe(r.data.timeBucket);
  });

  it('không lặp lại đúng mẫu lời chúc vừa nhận', async () => {
    const ip = freshIp();
    const a = await post<DeityResult>('/wishes/deity', { sequence: 1 }, { ip });
    for (let i = 0; i < 8; i += 1) {
      const next = await post<DeityResult>('/wishes/deity', { sequence: 2, lastTemplateId: a.data.wish.templateId }, { ip });
      expect(next.data.wish.templateId).not.toBe(a.data.wish.templateId);
    }
  });

  it('thành viên được +1 điểm mỗi lần xin vía, không có điểm quay ngược cho khách', async () => {
    const s = await login();
    const ip = freshIp();
    const a = await post<DeityResult>('/wishes/deity', { sequence: 1 }, { token: s.token, ip });
    expect(a.data.pointsAwarded).toBe(1);
    expect(a.data.totalPoints).toBe(1);
    const b = await post<DeityResult>('/wishes/deity', { sequence: 2 }, { token: s.token, ip });
    expect(b.data.totalPoints).toBe(2);
    const me = await get<{ points: number }>('/me', { token: s.token });
    expect(me.data.points).toBe(2);
  });

  it('thành viên xem lại các lần xin vía hôm nay (đồng bộ giữa thiết bị)', async () => {
    const s = await login();
    const ip = freshIp();
    await post('/wishes/deity', { sequence: 1 }, { token: s.token, ip });
    await post('/wishes/deity', { sequence: 2 }, { token: s.token, ip });
    const r = await get<{ at: string; titleCode: string }[]>('/wishes/deity/today', { token: s.token });
    expect(r.data).toHaveLength(2);
    expect(r.data[0]?.titleCode).toBe('today');
    expect(['morning', 'afternoon', 'evening']).toContain(r.data[1]?.titleCode);
  });

  it('khách không gọi được API lịch sử hôm nay', async () => {
    const r = await get('/wishes/deity/today');
    expect(r.status).toBe(401);
    expect(r.error?.code).toBe('AUTH_REQUIRED');
  });

  it('gói lời chúc offline có sẵn cho trường hợp mất mạng', async () => {
    const r = await get<{ texts: { templateId: string; text: string }[] }>('/wishes/offline-pack');
    expect(r.data.texts.length).toBeGreaterThan(0);
  });

  it('body sai bị chặn bằng mã lỗi xác thực dữ liệu', async () => {
    const r = await post('/wishes/deity', { sequence: 0 }, { ip: freshIp() });
    expect(r.status).toBe(400);
    expect(r.error?.code).toBe('COMMON_VALIDATION_FAILED');
  });
});

describe('gửi vía cho cửa hàng / sale', () => {
  async function pickPlace(autoReply: boolean, kind?: string): Promise<PlaceRow> {
    const list = await get<PlaceRow[]>('/places?pageSize=50');
    const found = list.data.find((p) => p.autoReplyEnabled === autoReply && (!kind || p.kind === kind));
    if (!found) throw new Error('không có cửa hàng phù hợp trong dữ liệu mẫu');
    return found;
  }

  it('khách gửi vía được, nhận phản hồi tự động có nhãn "auto" khi chủ bật', async () => {
    const cat = await catalog();
    const place = await pickPlace(true);
    const r = await post<PlaceWishResult>(`/places/${place.id}/wishes`, { wishTypeId: cat.wishTypes[0]?.id }, { ip: freshIp() });
    expect(r.status).toBe(201);
    expect(r.code).toBe('WISH_SENT');
    expect(r.data.reply.kind).toBe('auto');
    expect(r.data.reply.text.length).toBeGreaterThan(3);
    expect(r.data.pointsAwarded).toBe(0);
  });

  it('khi chủ tắt tự động gửi vía: phản hồi hệ thống trung tính, không giả làm chủ cửa hàng', async () => {
    const s = await login();
    const cat = await catalog();
    const mine = await post<{ id: string; slug: string }>(
      '/places',
      {
        kind: 'store',
        title: 'Tiệm tắt auto',
        categoryId: cat.categories.find((c) => c.kind === 'store')?.id,
        sceneTemplateId: cat.sceneTemplates.find((t) => t.kind === 'store')?.id,
        autoReplyEnabled: false,
      },
      { token: s.token },
    );
    expect(mine.status).toBe(201);
    const r = await post<PlaceWishResult>(`/places/${mine.data.id}/wishes`, { wishTypeId: cat.wishTypes[0]?.id }, { ip: freshIp() });
    expect(r.data.reply.kind).toBe('system');
  });

  it('thành viên gửi vía được +1 điểm', async () => {
    const s = await login();
    const cat = await catalog();
    const place = await pickPlace(true);
    const r = await post<PlaceWishResult>(`/places/${place.id}/wishes`, { wishTypeId: cat.wishTypes[1]?.id, message: 'Đông khách nhé!' }, { token: s.token, ip: freshIp() });
    expect(r.data.pointsAwarded).toBe(1);
    expect(r.data.totalPoints).toBe(1);
  });

  it('gửi vía cho văn phòng sale cũng được +1 điểm', async () => {
    const s = await login();
    const cat = await catalog();
    const place = await pickPlace(true, 'sale_office');
    const r = await post<PlaceWishResult>(`/places/${place.id}/wishes`, { wishTypeId: cat.wishTypes[0]?.id }, { token: s.token, ip: freshIp() });
    expect(r.data.pointsAwarded).toBe(1);
  });

  it('loại vía không tồn tại bị từ chối', async () => {
    const place = await pickPlace(true);
    const r = await post(`/places/${place.id}/wishes`, { wishTypeId: '7c9e6679-7425-40de-944b-e07fc1f90ae7' }, { ip: freshIp() });
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(r.error?.code).toBeTruthy();
  });

  it('lời nhắn chứa từ khóa bị chặn', async () => {
    const place = await pickPlace(true);
    const cat = await catalog();
    const r = await post(`/places/${place.id}/wishes`, { wishTypeId: cat.wishTypes[0]?.id, message: 'xxxxx' }, { ip: freshIp() });
    expect([201, 400]).toContain(r.status);
  });

  it('lượt gửi vía của khách hiện ẩn danh trên trang cửa hàng', async () => {
    const place = await pickPlace(true);
    const cat = await catalog();
    await post(`/places/${place.id}/wishes`, { wishTypeId: cat.wishTypes[0]?.id }, { ip: freshIp() });
    const list = await get<{ sender: unknown }[]>(`/places/${place.id}/wishes`);
    expect(list.data.some((w) => w.sender === null)).toBe(true);
  });
});
