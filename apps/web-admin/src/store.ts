import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authReducer, baseApi } from '@chot-via/api-client';
import { useDispatch, useSelector, useStore } from 'react-redux';

/** Trạng thái giao diện admin: menu trượt trên điện thoại/iPad dọc. */
export const adminUiSlice = createSlice({
  name: 'adminUi',
  initialState: { sidebarOpen: false },
  reducers: { sidebarToggled(state, action: PayloadAction<boolean>) { state.sidebarOpen = action.payload; } },
  selectors: { selectSidebarOpen: (s) => s.sidebarOpen },
});
export const { sidebarToggled } = adminUiSlice.actions;
export const { selectSidebarOpen } = adminUiSlice.selectors;

export const makeStore = () => configureStore({
  reducer: { [baseApi.reducerPath]: baseApi.reducer, auth: authReducer, adminUi: adminUiSlice.reducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
