import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ReportTarget, SceneModelKey } from '@chot-via/shared';
import type { RitualKind } from '@chot-via/scene-3d';

/** Khớp khóa i18n `auth.reason.*`. */
export type LoginReason = 'post' | 'react' | 'comment' | 'follow' | 'save' | 'place' | 'profile' | 'generic' | 'poll' | 'like' | 'block';

/** Cửa hàng của người dùng nhận nghi lễ. */
export interface RitualTarget { placeId: string; title: string; modelKey: SceneModelKey }
/** Nghi lễ đang chạy; `tick` tăng mỗi lần chạy để cảnh 3D dựng lại từ đầu. */
export interface RitualRun extends RitualTarget { kind: RitualKind; tick: number; /** Mốc (ms) cảnh 3D thực sự bắt đầu chạy; null khi cảnh còn đang tải. */ startedAt: number | null }

export interface UiState {
  /** Số lần xin vía Thần Tài đã được yêu cầu (tăng mỗi lần bấm nút Xin vía); thành phần WishBurst nghe giá trị này để nổ vía ngay. */
  wishRequest: number;
  /** Mốc thời gian (ms) trước đó bỏ qua các lần bấm tiếp theo, tránh bấm nhầm hai lần tạo hai lượt xin vía. */
  wishLockedUntil: number;
  /** Nghi lễ người dùng vừa bấm nhưng chưa có cửa hàng: tạo cửa hàng xong sẽ quay lại làm tiếp. */
  ritualPending: RitualKind | null;
  /** Cửa hàng vừa tạo xong: hiện hộp "cửa hàng sẵn sàng" với nút bấm đẹp để bắt đầu nghi lễ. */
  ritualOffer: RitualTarget | null;
  ritual: RitualRun | null;
  ritualTick: number;
  login: { open: boolean; reason: LoginReason };
  placeSheet: { placeId: string | null; step: 'detail' | 'wish' };
  report: { targetType: ReportTarget; targetId: string } | null;
}

/** Thời gian khóa nút Xin vía sau mỗi lần bấm (đúng bằng thời gian hiệu ứng nổ). */
const WISH_LOCK_MS = 3000;

const initialState: UiState = {
  wishRequest: 0,
  wishLockedUntil: 0,
  ritualPending: null,
  ritualOffer: null,
  ritual: null,
  ritualTick: 0,
  login: { open: false, reason: 'generic' },
  placeSheet: { placeId: null, step: 'detail' },
  report: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    wishRequested: {
      reducer(state, action: PayloadAction<number>) {
        if (action.payload < state.wishLockedUntil) return;
        state.wishRequest += 1;
        state.wishLockedUntil = action.payload + WISH_LOCK_MS;
      },
      prepare: () => ({ payload: Date.now() }),
    },
    ritualAsked(state, action: PayloadAction<RitualKind>) {
      state.ritualPending = action.payload;
    },
    ritualOffered(state, action: PayloadAction<RitualTarget>) {
      state.ritualOffer = action.payload;
    },
    ritualOfferClosed(state) {
      state.ritualOffer = null;
      state.ritualPending = null;
    },
    /** Bắt đầu một nghi lễ. Đang chạy dở thì bỏ qua (tránh bấm hai lần chồng cảnh). */
    ritualStarted(state, action: PayloadAction<RitualTarget & { kind: RitualKind }>) {
      if (state.ritual) return;
      state.ritualTick += 1;
      state.ritual = { ...action.payload, tick: state.ritualTick, startedAt: null };
      state.ritualOffer = null;
      state.ritualPending = null;
    },
    ritualPlaying: {
      reducer(state, action: PayloadAction<{ tick: number; at: number }>) {
        if (state.ritual && state.ritual.tick === action.payload.tick && state.ritual.startedAt === null) state.ritual.startedAt = action.payload.at;
      },
      prepare: (tick: number) => ({ payload: { tick, at: Date.now() } }),
    },
    ritualEnded(state) {
      state.ritual = null;
    },
    loginRequested(state, action: PayloadAction<LoginReason>) {
      state.login = { open: true, reason: action.payload };
    },
    loginDismissed(state) {
      state.login.open = false;
    },
    placeSheetOpened(state, action: PayloadAction<{ placeId: string; step?: 'detail' | 'wish' }>) {
      state.placeSheet = { placeId: action.payload.placeId, step: action.payload.step ?? 'detail' };
    },
    placeSheetStepChanged(state, action: PayloadAction<'detail' | 'wish'>) {
      state.placeSheet.step = action.payload;
    },
    placeSheetClosed(state) {
      state.placeSheet = { placeId: null, step: 'detail' };
    },
    reportRequested(state, action: PayloadAction<{ targetType: ReportTarget; targetId: string }>) {
      state.report = action.payload;
    },
    reportDismissed(state) {
      state.report = null;
    },
  },
  selectors: {
    selectWishRequest: (s) => s.wishRequest,
    selectLogin: (s) => s.login,
    selectRitual: (s) => s.ritual,
    selectRitualOffer: (s) => s.ritualOffer,
    selectRitualPending: (s) => s.ritualPending,
    selectPlaceSheet: (s) => s.placeSheet,
    selectReport: (s) => s.report,
  },
});

export const {
  wishRequested,
  ritualAsked,
  ritualOffered,
  ritualOfferClosed,
  ritualStarted,
  ritualPlaying,
  ritualEnded,
  loginRequested,
  loginDismissed,
  placeSheetOpened,
  placeSheetStepChanged,
  placeSheetClosed,
  reportRequested,
  reportDismissed,
} = uiSlice.actions;
export const { selectWishRequest, selectRitual, selectRitualOffer, selectRitualPending, selectLogin, selectPlaceSheet, selectReport } = uiSlice.selectors;
