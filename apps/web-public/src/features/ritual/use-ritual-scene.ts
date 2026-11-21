'use client';

import type { RitualScene } from '@chot-via/scene-3d';
import { useCallback } from 'react';
import { ritualPlaying, selectRitual } from '@/features/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

/** Nối nghi lễ đang chạy (Redux) vào thành phố 3D: truyền `...useRitualScene()` vào `CityView`. */
export function useRitualScene(): { ritual: RitualScene | null; onRitualStart: (tick: number) => void } {
  const dispatch = useAppDispatch();
  const run = useAppSelector(selectRitual);
  const onRitualStart = useCallback((tick: number): void => { dispatch(ritualPlaying(tick)); }, [dispatch]);
  return { ritual: run, onRitualStart };
}
