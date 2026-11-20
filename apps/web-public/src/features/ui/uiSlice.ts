import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ReportTarget } from '@chot-via/shared';

/** Khớp khóa i18n `auth.reason.*`. */
export type LoginReason = 'post' | 'react' | 'comment' | 'follow' | 'save' | 'place' | 'profile' | 'generic' | 'poll' | 'like' | 'block';

export interface UiState {
  wishDialogOpen: boolean;
  login: { open: boolean; reason: LoginReason };
  placeSheet: { placeId: string | null; step: 'detail' | 'wish' };
  report: { targetType: ReportTarget; targetId: string } | null;
}

const initialState: UiState = {
  wishDialogOpen: false,
  login: { open: false, reason: 'generic' },
  placeSheet: { placeId: null, step: 'detail' },
  report: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    wishDialogToggled(state, action: PayloadAction<boolean>) {
      state.wishDialogOpen = action.payload;
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
    selectWishDialogOpen: (s) => s.wishDialogOpen,
    selectLogin: (s) => s.login,
    selectPlaceSheet: (s) => s.placeSheet,
    selectReport: (s) => s.report,
  },
});

export const { wishDialogToggled, loginRequested, loginDismissed, placeSheetOpened, placeSheetStepChanged, placeSheetClosed, reportRequested, reportDismissed } = uiSlice.actions;
export const { selectWishDialogOpen, selectLogin, selectPlaceSheet, selectReport } = uiSlice.selectors;
