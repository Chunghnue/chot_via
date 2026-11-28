import type { SceneModelKey, StreetSlotDto } from '@xin-via/shared';

/** Hai nghi lễ cho cửa hàng của chính người dùng: Thỉnh Thần Tài (Thần Tài chạy tới gõ cửa, vung vàng) và Đốt vía (người cầm giấy đốt vía đi lại trước cửa). */
export type RitualKind = 'invoke' | 'burn';

/** Yêu cầu chạy một nghi lễ trong cảnh phố; `tick` tăng mỗi lần chạy để cảnh dựng lại từ đầu. */
export interface RitualScene {
  kind: RitualKind;
  tick: number;
  placeId: string;
  title: string;
  modelKey: SceneModelKey;
}

/** Mốc thời gian (giây) của từng nghi lễ. Cảnh 3D và chữ phụ đề ở trang chủ cùng đọc các mốc này nên luôn khớp nhau. */
export const RITUAL_BEATS = {
  invoke: {
    seconds: 20,
    /** Thần Tài nhảy khỏi bệ → chạy tới cửa hàng → đứng trước cửa. */
    jump: 1, run: 2, arrive: 6.5,
    /** Ba tiếng gõ cửa. */
    knocks: [7.4, 8.1, 8.8],
    /** Cửa mở, ánh sáng tràn ra, Thần Tài chúc. */
    open: 9.8, greet: 11.3,
    /** Ba lần vung tay, mỗi lần vàng văng tung toé. */
    throws: [13, 14.6, 16.2],
    /** Chạy về bệ. */
    back: 17.6, home: 19.6,
  },
  burn: {
    seconds: 10,
    /** Người cầm giấy vào cảnh, giấy bắt lửa, cháy hết, cửa hàng sáng vàng. */
    enter: 0.5, ignite: 1.2, ash: 8.3,
  },
} as const;

/** Thời gian chạy của mỗi nghi lễ (giây). */
export const RITUAL_SECONDS: Record<RitualKind, number> = { invoke: RITUAL_BEATS.invoke.seconds, burn: RITUAL_BEATS.burn.seconds };

/** Chỗ đặt cửa hàng của người dùng trong cảnh khi cửa hàng chưa nằm trên phố (mét; cạnh quảng trường Thần Tài). */
export const RITUAL_SPOT = { x: -10.4, z: 3.6 } as const;

/** Kiểu cửa hàng không có ô riêng trên phố (Bán lẻ, Chung…) thì nghi lễ diễn ra ở ô của kiểu này. */
export const RITUAL_FALLBACK_MODEL: SceneModelKey = 'restaurant';

/**
 * Ô cửa hàng trên phố mà nghi lễ phải đi tới (không dựng bản sao cửa hàng nào, tránh che các cửa hàng khác): ô của chính cửa hàng đó; nếu cửa hàng chưa có ô thì ô của cửa hàng cùng kiểu
 * (hai cửa hàng cùng kiểu cùng một chỗ); kiểu không có ô thì ô `RITUAL_FALLBACK_MODEL`. Chỉ xét ô đã có cửa hàng. Trả về null khi phố chưa có ô nào.
 */
export function pickRitualSlot(slots: readonly StreetSlotDto[], placeId: string, modelKey: SceneModelKey): StreetSlotDto | null {
  const used = slots.filter((s) => s.placeId !== null);
  return used.find((s) => s.placeId === placeId) ?? used.find((s) => s.modelKey === modelKey) ?? used.find((s) => s.modelKey === RITUAL_FALLBACK_MODEL) ?? used[0] ?? null;
}
