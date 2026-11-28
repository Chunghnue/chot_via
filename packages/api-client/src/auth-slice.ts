import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthSession, MeDto } from '@xin-via/shared';

/** unknown = chưa thử khôi phục phiên (khi tải trang); guest = khách; member = đã đăng nhập. */
export interface AuthState {
  status: 'unknown' | 'guest' | 'member';
  accessToken: string | null;
  user: MeDto | null;
}

const initialState: AuthState = { status: 'unknown', accessToken: null, user: null };

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionStarted(state, action: PayloadAction<AuthSession>) {
      state.status = 'member';
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    sessionCleared(state) {
      state.status = 'guest';
      state.accessToken = null;
      state.user = null;
    },
    userUpdated(state, action: PayloadAction<MeDto>) {
      state.user = action.payload;
    },
    pointsChanged(state, action: PayloadAction<number>) {
      if (state.user) state.user.points = action.payload;
    },
  },
  selectors: {
    selectAuthStatus: (state) => state.status,
    selectAccessToken: (state) => state.accessToken,
    selectCurrentUser: (state) => state.user,
    selectIsMember: (state) => state.status === 'member',
  },
});

export const { sessionStarted, sessionCleared, userUpdated, pointsChanged } = authSlice.actions;
export const { selectAuthStatus, selectAccessToken, selectCurrentUser, selectIsMember } = authSlice.selectors;
export const authReducer = authSlice.reducer;

export function hasAuthState(state: unknown): state is { auth: AuthState } {
  return typeof state === 'object' && state !== null && 'auth' in state;
}
