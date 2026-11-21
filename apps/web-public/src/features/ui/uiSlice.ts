import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ReportTarget } from '@chot-via/shared';

/** Khớp khóa i18n `auth.reason.*`. */
export type LoginReason = 'post' | 'react' | 'comment' | 'follow' | 'save' | 'place' | 'profile' | 'generic' | 'poll' | 'like' | 'block';

export interface UiState {
  /** Số lần xin vía Thần Tài đã được yêu cầu (tăng mỗi lần bấm nút Xin vía); thành phần WishBurst nghe giá trị này để nổ vía ngay. */
  wishRequest: number;
  /** Mốc thời gian (ms) trước đó bỏ qua các lần bấm tiếp theo, tránh bấm nhầm hai lần tạo hai lượt xin vía. */
  wishLockedUntil: number;
  login: { open: boolean; reason: LoginReason };
  placeSheet: { placeId: string | null; step: 'detail' | 'wish' };
  report: { targetType: ReportTarget; targetId: string } | null;
}

/** Thời gian khóa nút Xin vía sau mỗi lần bấm (đúng bằng thời gian hiệu ứng nổ). */
const WISH_LOCK_MS = 3000;

const initialState: UiState = {
  wishRequest: 0,
  wishLockedUntil: 0,
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
    selectPlaceSheet: (s) => s.placeSheet,
    selectReport: (s) => s.report,
  },
});

export const { wishRequested, loginRequested, loginDismissed, placeSheetOpened, placeSheetStepChanged, placeSheetClosed, reportRequested, reportDismissed } = uiSlice.actions;
export const { selectWishRequest, selectLogin, selectPlaceSheet, selectReport } = uiSlice.selectors;
