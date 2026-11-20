import { configureStore } from '@reduxjs/toolkit';
import { authReducer, baseApi } from '@chot-via/api-client';
import { composerSlice } from '@/features/composer/composerSlice';
import { feedSlice } from '@/features/feed/feedSlice';
import { streetSlice } from '@/features/street/streetSlice';
import { uiSlice } from '@/features/ui/uiSlice';
import { wishSlice } from '@/features/wish/wishSlice';
import { listenerMiddleware } from './listeners';

export const makeStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: authReducer,
      ui: uiSlice.reducer,
      wish: wishSlice.reducer,
      composer: composerSlice.reducer,
      feed: feedSlice.reducer,
      street: streetSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware).concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
