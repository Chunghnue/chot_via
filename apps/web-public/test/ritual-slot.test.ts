import { describe, expect, it } from 'vitest';
import type { SceneModelKey, StreetSlotDto } from '@xin-via/shared';
import { pickRitualSlot } from '../../../packages/scene-3d/src/ritual';

const slot = (id: string, modelKey: SceneModelKey, placeId: string | null, x: number, z: number): StreetSlotDto => ({
  id, label: id, placeId, modelKey, glb: { high: null, lod1: null, lod2: null }, modelScale: 1, region: { x: 0, y: 0, w: 0, h: 0 }, position: { x, z, rotationDeg: 0 },
});
const street = [
  slot('cafe', 'cafe', 'p-cafe', -11.5, 4), slot('fashion', 'fashion', 'p-fashion', -11.5, -5), slot('restaurant', 'restaurant', 'p-restaurant', -11.5, -14),
  slot('sale', 'sale_office', 'p-sale', 11.5, 4), slot('minimart', 'minimart', 'p-minimart', 11.5, -5), slot('pharmacy', 'pharmacy', 'p-pharmacy', 11.5, -14),
];

describe('chọn ô cửa hàng cho nghi lễ Đốt vía / Thỉnh Thần Tài', () => {
  it('cửa hàng đã có ô trên phố thì đi tới đúng ô đó', () => {
    expect(pickRitualSlot(street, 'p-sale', 'sale_office')?.id).toBe('sale');
  });
  it('cửa hàng của thành viên chưa có ô: đi tới ô của cửa hàng cùng kiểu (Minimart → ô Minimart, không phải ô Quán Cafe)', () => {
    expect(pickRitualSlot(street, 'p-moi', 'minimart')?.id).toBe('minimart');
    expect(pickRitualSlot(street, 'p-moi-2', 'minimart')?.id).toBe('minimart');
  });
  it('kiểu không có ô trên phố (Bán lẻ, Chung) thì đi tới ô Nhà hàng', () => {
    expect(pickRitualSlot(street, 'p-moi', 'retail')?.id).toBe('restaurant');
    expect(pickRitualSlot(street, 'p-moi', 'generic')?.id).toBe('restaurant');
  });
  it('bỏ qua ô trống (chưa có cửa hàng)', () => {
    const withEmpty = [slot('trong', 'minimart', null, 0, 0), ...street];
    expect(pickRitualSlot(withEmpty, 'p-moi', 'minimart')?.id).toBe('minimart');
  });
  it('phố không có ô nào thì trả về null', () => {
    expect(pickRitualSlot([], 'p-moi', 'cafe')).toBeNull();
  });
});
