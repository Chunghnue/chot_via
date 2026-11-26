import { useGetLeaderboardQuery } from '@chot-via/api-client';
import { useMemo } from 'react';
import { useTranslations } from 'use-intl';

/** Số tên thành viên tối đa gắn lên người đi lại trong phố 3D. */
const WALKER_NAME_COUNT = 8;

/**
 * Tên người đi lại trong phố 3D lấy từ thành viên thật đang đứng đầu bảng điểm cộng đồng (không còn tên đặt sẵn).
 * Chưa có thành viên nào thì không hiện tên; truyền thẳng vào prop `walkers` của `CityView`.
 */
export function useWalkers(): { names: readonly string[]; groupLabel: string } {
  const t = useTranslations('home.scene');
  const { data } = useGetLeaderboardQuery(WALKER_NAME_COUNT);
  const names = useMemo(() => (data?.items ?? []).map((i) => i.user.displayName), [data]);
  return { names, groupLabel: t('walkerGroup') };
}
