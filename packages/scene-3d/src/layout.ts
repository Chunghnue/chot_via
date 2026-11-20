import type { PlaceSummary } from '@chot-via/shared';

export const ROW_SPACING = 7;
export const SIDE_OFFSET = 5.6;
/** Quảng trường Thần Tài ở đầu phố (z dương), các dãy nhà kéo dài về phía z âm. */
export const PLAZA_Z = 7;

export interface PlacedShop { place: PlaceSummary; x: number; z: number; rotationY: number }

/** Bố trí điểm hai bên đường theo thứ tự trên phố; nhà bên trái quay mặt sang phải và ngược lại. */
export function layoutShops(places: PlaceSummary[]): PlacedShop[] {
  return places.map((place, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    return { place, x: side * SIDE_OFFSET, z: PLAZA_Z - 6 - row * ROW_SPACING, rotationY: side === -1 ? Math.PI / 2 : -Math.PI / 2 };
  });
}

export function streetEndZ(count: number): number {
  return PLAZA_Z - 6 - Math.max(Math.ceil(count / 2) - 1, 0) * ROW_SPACING - 6;
}
