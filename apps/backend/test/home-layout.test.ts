import { describe, expect, it } from 'vitest';
import { DEFAULT_HOME_CONFIG, type HomeConfig, type HomeLayout } from '@chot-via/shared';
import { adminLogin, del, get, login, post, put } from './support/api';

interface Item { id: string }
interface SceneTemplate extends Item { name: string; modelKey: string; glbUrl: string | null }

describe('trang chủ: bố cục do admin nhập', () => {
  it('khách đọc được hero, hàng nút, chân trang và các ô cửa hàng (kèm file GLB 3 mức chi tiết)', async () => {
    const r = await get<{ layout: HomeLayout }>('/home');
    expect(r.status).toBe(200);
    const { layout } = r.data;
    expect(layout.config.heroImageUrl).toBe(DEFAULT_HOME_CONFIG.heroImageUrl);
    expect(layout.actions.map((a) => a.code)).toEqual(['story', 'send_wish', 'get_wish', 'brag']);
    expect(layout.actions.every((a) => a.showMobile && a.showTablet && a.showDesktop)).toBe(true);
    expect(layout.actions.find((a) => a.code === 'story')?.sortDesktop).toBe(0);
    expect(layout.footerLinks.length).toBeGreaterThan(0);
    const cafe = layout.street.find((s) => s.modelKey === 'cafe');
    expect(cafe?.glb).toEqual({ high: '/3d/models/cafe.glb', lod1: '/3d/models/cafe_lod1.glb', lod2: '/3d/models/cafe_lod2.glb' });
    expect(cafe?.placeId).not.toBeNull();
    expect(cafe?.region.w).toBeGreaterThan(0);
  });

  it('phố 3D: đủ 6 cửa hàng hai bên (có nhà thuốc), vật trang trí, người đi bộ và điểm nhìn camera', async () => {
    const { layout } = (await get<{ layout: HomeLayout }>('/home')).data;
    const keys = layout.street.map((s) => s.modelKey).sort();
    expect(keys).toEqual(expect.arrayContaining(['cafe', 'fashion', 'minimart', 'pharmacy', 'restaurant', 'sale_office']));
    expect(layout.street.find((s) => s.modelKey === 'pharmacy')?.glb?.high).toBe('/3d/models/pharmacy.glb');
    const { config } = layout;
    expect(config.props.length).toBeGreaterThan(0);
    expect(config.pedestrians).toBeGreaterThanOrEqual(0);
    expect(config.camera.targetY).toBeTypeOf('number');
    expect(config.camera.targetZ).toBeTypeOf('number');
  });

  it('chỉ admin xem/sửa cấu hình hero; dữ liệu sai bị chặn; sửa xong trang chủ đổi theo', async () => {
    const member = await login();
    expect((await get('/admin/home-config', { token: member.token })).status).toBe(403);
    const a = await adminLogin();
    const current = await get<HomeConfig>('/admin/home-config', { token: a.token });
    expect(current.status).toBe(200);
    expect((await put('/admin/home-config', { ...current.data, camera: { ...current.data.camera, fov: 5 } }, { token: a.token })).status).toBe(400);
    const next: HomeConfig = { ...current.data, heroTitle: 'Phố thử nghiệm', signLines: ['Dòng một', 'Dòng hai'] };
    expect((await put('/admin/home-config', next, { token: a.token })).status).toBeLessThan(300);
    const home = await get<{ layout: HomeLayout }>('/home');
    expect(home.data.layout.config.heroTitle).toBe('Phố thử nghiệm');
    expect(home.data.layout.config.signLines).toEqual(['Dòng một', 'Dòng hai']);
    expect((await put('/admin/home-config', current.data, { token: a.token })).status).toBeLessThan(300);
  });

  it('nút hành động: thêm, ẩn trên iPad, xuất hiện ở trang chủ, xóa', async () => {
    const a = await adminLogin();
    const body = {
      code: 'thu_nghiem',
      label: 'Nút thử',
      subLabel: '',
      iconUrl: null,
      kind: 'link',
      href: '/bang-tin',
      showMobile: true,
      showTablet: false,
      showDesktop: true,
      sortOrder: 99,
      sortTablet: null,
      sortDesktop: null,
      active: true,
    };
    const c = await post<Item>('/admin/catalog/home-actions', body, { token: a.token });
    expect(c.status).toBeLessThan(300);
    const found = (await get<{ layout: HomeLayout }>('/home')).data.layout.actions.find((x) => x.code === 'thu_nghiem');
    expect(found?.showTablet).toBe(false);
    expect(found?.href).toBe('/bang-tin');
    expect((await post('/admin/catalog/home-actions', { ...body, kind: 'khac' }, { token: a.token })).status).toBe(400);
    expect((await del(`/admin/catalog/home-actions/${c.data.id}`, { token: a.token })).status).toBeLessThan(300);
    expect((await get<{ layout: HomeLayout }>('/home')).data.layout.actions.some((x) => x.code === 'thu_nghiem')).toBe(false);
  });

  it('ô cửa hàng trên phố và model GLB thay được ở admin, không cần đổi code', async () => {
    const a = await adminLogin();
    const scenes = await get<SceneTemplate[]>('/admin/catalog/scene-templates', { token: a.token });
    const cafe = scenes.data.find((s) => s.modelKey === 'cafe');
    expect(cafe?.glbUrl).toBe('/3d/models/cafe.glb');
    const slots = await get<(Item & { label: string; sceneTemplateId: string; imageX: number })[]>('/admin/catalog/street-slots', { token: a.token });
    expect(slots.data.length).toBeGreaterThanOrEqual(5);
    const slot = slots.data.find((s) => s.label === 'Quán Cafe');
    expect(slot).toBeDefined();
    const updated = await put(`/admin/catalog/street-slots/${slot?.id ?? ''}`, { ...slot, imageX: 3 }, { token: a.token });
    expect(updated.status).toBeLessThan(300);
    expect((await get<{ layout: HomeLayout }>('/home')).data.layout.street.find((s) => s.label === 'Quán Cafe')?.region.x).toBe(3);
    await put(`/admin/catalog/street-slots/${slot?.id ?? ''}`, { ...slot, imageX: 1 }, { token: a.token });
  });

  it('tải file lên: chỉ admin, chỉ nhận ảnh hoặc GLB hợp lệ', async () => {
    const member = await login();
    const form = new FormData();
    form.append('file', new Blob([Buffer.from('glTF\x02\x00\x00\x00')], { type: 'model/gltf-binary' }), 'a.glb');
    const base = (await import('./support/api')).BASE;
    const call = async (token: string, f: FormData) => fetch(`${base}/admin/assets`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'x-requested-with': 'chotvia' }, body: f });
    expect((await call(member.token, form)).status).toBe(403);
    const a = await adminLogin();
    const ok = await call(a.token, form);
    expect(ok.status).toBeLessThan(300);
    const json = (await ok.json()) as { data: { url: string } };
    expect(json.data.url).toMatch(/\.glb$/);
    const bad = new FormData();
    bad.append('file', new Blob(['not a model'], { type: 'text/plain' }), 'x.txt');
    expect((await call(a.token, bad)).status).toBe(400);
  });
});
