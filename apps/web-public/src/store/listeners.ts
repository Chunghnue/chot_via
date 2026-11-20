import { createAction, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { sessionStarted } from '@chot-via/api-client';
import { composerClosed, composerHydrated, composerOpened, draftChanged, kindChosen, PersistedComposerSchema, stepChanged } from '@/features/composer/composerSlice';
import { loginDismissed } from '@/features/ui/uiSlice';
import { offlinePackLoaded, PersistedPackSchema, PersistedWishSchema, wishHydrated, wishRecorded } from '@/features/wish/wishSlice';
import { readJson, removeKey, STORAGE_KEYS, writeJson } from '@/lib/storage';
import type { AppDispatch, RootState } from './store';

/** Tác dụng phụ (lưu/khôi phục bộ đếm xin vía, bản nháp, đóng sheet đăng nhập) đặt ở listener middleware theo chuẩn Redux Toolkit. */
export const listenerMiddleware = createListenerMiddleware();
const startListening = listenerMiddleware.startListening.withTypes<RootState, AppDispatch>();

export const appStarted = createAction('app/appStarted');

startListening({
  actionCreator: appStarted,
  effect: (_action, api) => {
    const wish = readJson('local', STORAGE_KEYS.wish, PersistedWishSchema);
    const pack = readJson('local', STORAGE_KEYS.offlinePack, PersistedPackSchema);
    api.dispatch(wishHydrated({ wish, pack: pack?.texts ?? [] }));
    const draft = readJson('session', STORAGE_KEYS.draft, PersistedComposerSchema);
    if (draft) api.dispatch(composerHydrated(draft));
  },
});

startListening({
  actionCreator: wishRecorded,
  effect: (_action, api) => {
    const { startedAt, entries, lastTemplateId } = api.getState().wish;
    if (startedAt !== null) writeJson('local', STORAGE_KEYS.wish, { startedAt, entries, lastTemplateId });
  },
});

startListening({
  actionCreator: offlinePackLoaded,
  effect: (action) => writeJson('local', STORAGE_KEYS.offlinePack, { texts: action.payload }),
});

startListening({
  matcher: isAnyOf(composerOpened, kindChosen, draftChanged, stepChanged, composerClosed),
  effect: (_action, api) => {
    const { open, step, draft } = api.getState().composer;
    if (draft) writeJson('session', STORAGE_KEYS.draft, { open, step, draft });
    else removeKey('session', STORAGE_KEYS.draft);
  },
});

/** Đăng nhập xong thì đóng sheet đăng nhập; popup soạn bài (và bản nháp) vẫn nguyên để người dùng xác nhận đăng. */
startListening({ actionCreator: sessionStarted, effect: (_action, api) => { api.dispatch(loginDismissed()); } });
