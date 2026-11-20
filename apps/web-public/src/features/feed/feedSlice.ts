import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { FeedSort, FeedType, MemberRole } from '@chot-via/shared';

export interface FeedState { type: FeedType; sort: FeedSort; role: MemberRole | null }
const initialState: FeedState = { type: 'all', sort: 'new', role: null };

export const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    feedTypeChanged(state, action: PayloadAction<FeedType>) { state.type = action.payload; },
    feedSortChanged(state, action: PayloadAction<FeedSort>) { state.sort = action.payload; },
    feedRoleChanged(state, action: PayloadAction<MemberRole | null>) { state.role = action.payload; },
  },
  selectors: { selectFeedFilters: (s) => s },
});

export const { feedTypeChanged, feedSortChanged, feedRoleChanged } = feedSlice.actions;
export const { selectFeedFilters } = feedSlice.selectors;
