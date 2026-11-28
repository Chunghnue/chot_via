'use client';

import { DEFAULT_SETTINGS, getTimeBucket, resolveWishTitleCode, type TimeBucket, type WishTitleCode } from '@xin-via/shared';
import { parseApiError, useDeityWishMutation, useGetCatalogQuery } from '@xin-via/api-client';
import { useTranslations } from 'use-intl';
import { useApiToast } from '@/lib/use-api-toast';
import { track } from '@/lib/analytics';
import { useRequireMember } from '@/lib/use-member';
import { useMounted } from '@/lib/use-mounted';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectLastTemplateId, selectOfflinePack, selectWishCount, wishRecorded } from './wishSlice';

export function useWishSettings() {
  const { data } = useGetCatalogQuery();
  return data?.settings ?? DEFAULT_SETTINGS;
}

/** FR-03: lần đầu "hôm nay", từ lần 2 theo giờ thực tế Việt Nam (hoặc thứ tự cứng khi bật campaign). */
export function useWishTitle(): { titleCode: WishTitleCode; bucket: TimeBucket } {
  const settings = useWishSettings();
  const stored = useAppSelector(selectWishCount);
  /** Bộ đếm lấy từ localStorage chỉ có sau khi mount, nên lần render đầu (cả lúc hydrate) coi như chưa xin lần nào để HTML khớp máy chủ. */
  const count = useMounted() ? stored : 0;
  const bucket = getTimeBucket(new Date(), settings.timeWindows);
  return { bucket, titleCode: resolveWishTitleCode({ sequence: count + 1, bucket, campaignMode: settings.campaignMode }) };
}

export function useDeityWish() {
  const dispatch = useAppDispatch();
  const [mutate, { isLoading }] = useDeityWishMutation();
  const count = useAppSelector(selectWishCount);
  const lastId = useAppSelector(selectLastTemplateId);
  const pack = useAppSelector(selectOfflinePack);
  const { bucket, titleCode } = useWishTitle();
  const { isMember } = useRequireMember();
  const toast = useApiToast();
  const t = useTranslations('wish');

  const receive = async (): Promise<void> => {
    try {
      const data = await mutate({ sequence: count + 1, ...(lastId ? { lastTemplateId: lastId } : {}) }).unwrap();
      dispatch(wishRecorded({
        entry: { at: new Date().toISOString(), titleCode: data.titleCode, templateId: data.wish.templateId, offline: false },
        text: data.wish.text, animationKey: data.wish.animationKey, pointsAwarded: data.pointsAwarded === 1,
      }));
      track('wish_received', { target: 'deity', member: isMember, offline: false });
    } catch (error) {
      if (parseApiError(error).code !== 'NETWORK') {
        toast.error(error);
        return;
      }
      /* Mất mạng: dùng lời chúc dự phòng đã cache, không khẳng định đã ghi nhận trên hệ thống. */
      const fallback = pack[Math.floor(Math.random() * pack.length)];
      dispatch(wishRecorded({
        entry: { at: new Date().toISOString(), titleCode, templateId: fallback?.templateId ?? 'offline', offline: true },
        text: fallback?.text ?? t('offlineFallback'), animationKey: fallback?.animationKey ?? 'sparkle', pointsAwarded: false,
      }));
      track('wish_received', { target: 'deity', member: isMember, offline: true });
    }
  };

  return { receive, isLoading, titleCode, bucket, count };
}
