import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PlaceKind } from '@xin-via/shared';

export type StreetTab = 'walk' | 'friends' | 'top';

export interface StreetState { search: string; categoryId: string | null; kind: PlaceKind | null; tab: StreetTab; selectedId: string | null }
const initialState: StreetState = { search: '', categoryId: null, kind: null, tab: 'walk', selectedId: null };

export const streetSlice = createSlice({
  name: 'street',
  initialState,
  reducers: {
    searchChanged(state, action: PayloadAction<string>) { state.search = action.payload; },
    categoryChanged(state, action: PayloadAction<string | null>) { state.categoryId = action.payload; },
    kindChanged(state, action: PayloadAction<PlaceKind | null>) { state.kind = action.payload; },
    tabChanged(state, action: PayloadAction<StreetTab>) { state.tab = action.payload; },
    placeFocused(state, action: PayloadAction<string | null>) { state.selectedId = action.payload; },
  },
  selectors: { selectStreet: (s) => s },
});

export const { searchChanged, categoryChanged, kindChanged, tabChanged, placeFocused } = streetSlice.actions;
export const { selectStreet } = streetSlice.selectors;
