'use client';

import { placesApi } from '@xin-via/api-client';
import type { RitualKind } from '@xin-via/scene-3d';
import { toast } from '@xin-via/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useTranslations } from 'use-intl';
import { ritualAsked, ritualStarted, type RitualTarget } from '@/features/ui/uiSlice';
import { useRequireMember } from '@/lib/use-member';
import { useAppDispatch } from '@/store/hooks';

/** Các trang có thành phố 3D để diễn nghi lễ; ở trang khác thì chuyển về trang chủ. */
const SCENE_PATHS = ['/', '/pho-3d'];

/**
 * Nghi lễ cho cửa hàng của chính người dùng: Thỉnh Thần Tài (Thần Tài chạy tới gõ cửa, vung vàng) và Đốt vía (người cầm giấy đốt vía đi lại trước cửa).
 * Chưa có cửa hàng thì dẫn đi tạo cửa hàng, tạo xong sẽ hiện nút để bắt đầu. Không giới hạn số lần, không cộng điểm, không ghi vào cơ sở dữ liệu.
 */
export function useRitual() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('wish.ritual');
  const { require } = useRequireMember();

  const begin = useCallback((kind: RitualKind, target: RitualTarget): void => {
    dispatch(ritualStarted({ kind, ...target }));
    if (!SCENE_PATHS.includes(pathname)) router.push('/');
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dispatch, pathname, router]);

  const request = useCallback(async (kind: RitualKind): Promise<void> => {
    if (!require('place')) return;
    const sub = dispatch(placesApi.endpoints.getMyPlaces.initiate(undefined));
    try {
      const mine = await sub.unwrap();
      const place = mine.find((p) => p.kind === 'store') ?? mine[0];
      if (!place) {
        dispatch(ritualAsked(kind));
        toast(t('needStore'));
        router.push('/tao-diem');
        return;
      }
      begin(kind, { placeId: place.id, title: place.title, modelKey: place.modelKey });
    } catch {
      toast.error(t('needStore'));
    } finally {
      sub.unsubscribe();
    }
  }, [begin, dispatch, require, router, t]);

  return { request, begin };
}
