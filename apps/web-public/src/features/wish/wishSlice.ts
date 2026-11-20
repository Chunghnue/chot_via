import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_SETTINGS, WISH_TITLE_CODES, WishTextSchema, type WishText, type WishTitleCode } from '@chot-via/shared';
import { z } from 'zod';

export const WishEntrySchema = z.object({ at: z.string(), titleCode: z.enum(WISH_TITLE_CODES), templateId: z.string(), offline: z.boolean() });
export type WishEntry = z.infer<typeof WishEntrySchema>;

/** Bộ đếm xin vía tạm thời theo thiết bị (không cần tài khoản), tự hết hạn theo TTL cấu hình (mặc định 24 giờ). */
export const PersistedWishSchema = z.object({ startedAt: z.number(), entries: z.array(WishEntrySchema), lastTemplateId: z.string().nullable() });
export type PersistedWish = z.infer<typeof PersistedWishSchema>;
export const PersistedPackSchema = z.object({ texts: z.array(WishTextSchema) });

export interface WishState {
  startedAt: number | null;
  entries: WishEntry[];
  lastTemplateId: string | null;
  offlinePack: WishText[];
  /** Lời chúc vừa nhận, hiển thị trong popup. */
  current: { text: string; animationKey: WishText['animationKey']; titleCode: WishTitleCode; offline: boolean; pointsAwarded: boolean } | null;
}

const initialState: WishState = { startedAt: null, entries: [], lastTemplateId: null, offlinePack: [], current: null };
const TTL_MS = DEFAULT_SETTINGS.wishCounterTtlHours * 3_600_000;

export const wishSlice = createSlice({
  name: 'wish',
  initialState,
  reducers: {
    hydrated(state, action: PayloadAction<{ wish: PersistedWish | null; pack: WishText[] }>) {
      const saved = action.payload.wish;
      if (saved && Date.now() - saved.startedAt < TTL_MS) {
        state.startedAt = saved.startedAt;
        state.entries = saved.entries;
        state.lastTemplateId = saved.lastTemplateId;
      }
      state.offlinePack = action.payload.pack;
    },
    offlinePackLoaded(state, action: PayloadAction<WishText[]>) {
      state.offlinePack = action.payload;
    },
    wishRecorded(state, action: PayloadAction<{ entry: WishEntry; text: string; animationKey: WishText['animationKey']; pointsAwarded: boolean }>) {
      if (state.startedAt === null || Date.now() - state.startedAt >= TTL_MS) {
        state.startedAt = Date.now();
        state.entries = [];
      }
      state.entries.push(action.payload.entry);
      if (!action.payload.entry.offline) state.lastTemplateId = action.payload.entry.templateId;
      state.current = {
        text: action.payload.text, animationKey: action.payload.animationKey, titleCode: action.payload.entry.titleCode,
        offline: action.payload.entry.offline, pointsAwarded: action.payload.pointsAwarded,
      };
    },
    /** Thành viên đăng nhập: lấy lại các lần xin vía hôm nay từ máy chủ để mọi thiết bị cùng một trạng thái. */
    wishSynced(state, action: PayloadAction<WishEntry[]>) {
      if (action.payload.length === 0) return;
      const known = new Set(state.entries.map((e) => e.at));
      const merged = [...state.entries.filter((e) => !e.offline), ...action.payload.filter((e) => !known.has(e.at))];
      state.entries = merged.sort((a, b) => a.at.localeCompare(b.at));
      state.startedAt = state.startedAt ?? Date.now();
    },
    currentCleared(state) {
      state.current = null;
    },
  },
  selectors: {
    selectWishEntries: (s) => s.entries,
    selectWishCount: (s) => s.entries.length,
    selectLastTemplateId: (s) => s.lastTemplateId,
    selectCurrentWish: (s) => s.current,
    selectOfflinePack: (s) => s.offlinePack,
  },
});

export const { hydrated: wishHydrated, offlinePackLoaded, wishRecorded, wishSynced, currentCleared } = wishSlice.actions;
export const { selectWishEntries, selectWishCount, selectLastTemplateId, selectCurrentWish, selectOfflinePack } = wishSlice.selectors;
