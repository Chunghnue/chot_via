import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DISPLAY_MODES, MEMBER_ROLES, METRIC_TYPES, STORY_STICKERS, type MemberRole, type MetricType } from '@xin-via/shared';
import { z } from 'zod';

export const COMPOSER_KINDS = ['story', 'brag', 'wish'] as const;
export type ComposerKind = (typeof COMPOSER_KINDS)[number];
export type ComposerStep = 'choose' | 'edit' | 'preview';

export const DraftSchema = z.object({
  kind: z.enum(COMPOSER_KINDS),
  body: z.string(),
  sticker: z.enum(STORY_STICKERS).nullable(),
  hashtags: z.array(z.string()),
  location: z.string(),
  media: z.array(z.object({ id: z.string(), url: z.string() })),
  pollEnabled: z.boolean(),
  pollOptions: z.array(z.string()),
  role: z.enum(MEMBER_ROLES),
  metricType: z.enum(METRIC_TYPES),
  displayMode: z.enum(DISPLAY_MODES),
  rangeCode: z.string().nullable(),
  amount: z.string(),
  wishTypeId: z.string().nullable(),
});
export type ComposerDraft = z.infer<typeof DraftSchema>;

export const PersistedComposerSchema = z.object({ open: z.boolean(), step: z.enum(['choose', 'edit', 'preview']), draft: DraftSchema.nullable() });

export interface ComposerState { open: boolean; step: ComposerStep; draft: ComposerDraft | null }

export function firstMetric(role: MemberRole): MetricType {
  return role === 'owner' ? 'revenue' : 'deal';
}

export function newDraft(kind: ComposerKind, role: MemberRole = 'owner'): ComposerDraft {
  return {
    kind, body: '', sticker: null, hashtags: [], location: '', media: [], pollEnabled: false, pollOptions: ['', ''],
    role, metricType: firstMetric(role), displayMode: 'hidden', rangeCode: null, amount: '', wishTypeId: null,
  };
}

const initialState: ComposerState = { open: false, step: 'choose', draft: null };

export const composerSlice = createSlice({
  name: 'composer',
  initialState,
  reducers: {
    composerHydrated(_state, action: PayloadAction<ComposerState>) {
      return action.payload;
    },
    /** Mở popup soạn bài; có `kind` thì vào thẳng bước soạn, không thì hiện bước chọn loại bài. */
    composerOpened(state, action: PayloadAction<{ kind?: ComposerKind; role?: MemberRole } | undefined>) {
      state.open = true;
      const kind = action.payload?.kind;
      if (kind) {
        if (!state.draft || state.draft.kind !== kind || (kind === 'brag' && action.payload?.role && state.draft.role !== action.payload.role)) {
          state.draft = newDraft(kind, action.payload?.role);
        }
        state.step = 'edit';
      } else {
        state.step = state.draft ? 'edit' : 'choose';
      }
    },
    kindChosen(state, action: PayloadAction<{ kind: ComposerKind; role?: MemberRole }>) {
      state.draft = newDraft(action.payload.kind, action.payload.role);
      state.step = 'edit';
    },
    draftChanged(state, action: PayloadAction<Partial<ComposerDraft>>) {
      if (state.draft) state.draft = { ...state.draft, ...action.payload };
    },
    stepChanged(state, action: PayloadAction<ComposerStep>) {
      state.step = action.payload;
    },
    composerClosed(state, action: PayloadAction<{ discard: boolean }>) {
      state.open = false;
      if (action.payload.discard) {
        state.draft = null;
        state.step = 'choose';
      }
    },
  },
  selectors: {
    selectComposer: (s) => s,
    selectComposerOpen: (s) => s.open,
    selectDraft: (s) => s.draft,
    selectComposerStep: (s) => s.step,
  },
});

export const { composerHydrated, composerOpened, kindChosen, draftChanged, stepChanged, composerClosed } = composerSlice.actions;
export const { selectComposer, selectComposerOpen, selectDraft, selectComposerStep } = composerSlice.selectors;
