import { DEFAULT_SHOP_CATALOG, type ShopCatalog } from '@xin-via/shared';
import { describe, expect, it } from 'vitest';
import { adminLogin, get, login, put } from './support/api';

describe('bảng giá và vật phẩm (admin quản lý)', () => {
  it('khách đọc được nội dung mặc định: 3 gói, quyền lợi, nguồn thu, 7 vật phẩm', async () => {
    const r = await get<ShopCatalog>('/shop');
    expect(r.status).toBe(200);
    expect(r.data.plans.map((p) => p.id)).toEqual(['free', 'plus', 'business']);
    expect(r.data.features.length).toBe(DEFAULT_SHOP_CATALOG.features.length);
    expect(r.data.revenue.length).toBe(6);
    expect(r.data.items.length).toBe(7);
  });

  it('chỉ admin đọc bản đầy đủ và sửa: khách 401, thành viên 403', async () => {
    expect((await get('/admin/shop')).status).toBe(401);
    expect((await put('/admin/shop', DEFAULT_SHOP_CATALOG)).status).toBe(401);
    const member = await login();
    expect((await get('/admin/shop', { token: member.token })).status).toBe(403);
    expect((await put('/admin/shop', DEFAULT_SHOP_CATALOG, { token: member.token })).status).toBe(403);
  });

  it('admin sửa giá và tắt một vật phẩm: trang công khai đổi theo, vật phẩm tắt không hiện; lưu xong khôi phục mặc định', async () => {
    const admin = await adminLogin();
    try {
      const next: ShopCatalog = {
        ...DEFAULT_SHOP_CATALOG,
        plans: DEFAULT_SHOP_CATALOG.plans.map((p) => (p.id === 'plus' ? { ...p, price: '35k/tháng' } : p)),
        items: DEFAULT_SHOP_CATALOG.items.map((i) => (i.id === 'cay' ? { ...i, name: 'Cây phát lộc', price: '25.000đ', active: false } : i)),
      };
      const saved = await put<ShopCatalog>('/admin/shop', next, { token: admin.token });
      expect(saved.status).toBe(200);
      expect(saved.code).toBe('UPDATED');
      const pub = await get<ShopCatalog>('/shop');
      expect(pub.data.plans.find((p) => p.id === 'plus')?.price).toBe('35k/tháng');
      expect(pub.data.items.some((i) => i.id === 'cay')).toBe(false);
      expect(pub.data.items.length).toBe(6);
      const full = await get<ShopCatalog>('/admin/shop', { token: admin.token });
      expect(full.data.items.find((i) => i.id === 'cay')).toMatchObject({ name: 'Cây phát lộc', price: '25.000đ', active: false });
    } finally {
      await put('/admin/shop', DEFAULT_SHOP_CATALOG, { token: admin.token });
    }
    expect((await get<ShopCatalog>('/shop')).data.items.length).toBe(7);
  });

  it('dữ liệu sai bị từ chối: gói rỗng, quyền lợi trỏ tới gói không có, ảnh ngoài danh sách, giá để trống', async () => {
    const admin = await adminLogin();
    const bad = async (body: unknown): Promise<number> => (await put('/admin/shop', body as ShopCatalog, { token: admin.token })).status;
    expect(await bad({ ...DEFAULT_SHOP_CATALOG, plans: [] })).toBe(400);
    expect(await bad({ ...DEFAULT_SHOP_CATALOG, features: [{ id: 'x', label: 'Quyền lợi', planIds: ['khong-co'] }] })).toBe(400);
    expect(await bad({ ...DEFAULT_SHOP_CATALOG, items: [{ id: 'a', name: 'A', price: '1đ', image: 'hinh-la.webp', active: true }] })).toBe(400);
    expect(await bad({ ...DEFAULT_SHOP_CATALOG, plans: [{ id: 'free', name: 'Free', price: '   ' }] })).toBe(400);
    expect((await get<ShopCatalog>('/shop')).data.plans.length).toBe(3);
  });
});
