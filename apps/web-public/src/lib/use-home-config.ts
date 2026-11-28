'use client';

import { useGetHomeQuery } from '@xin-via/api-client';
import { DEFAULT_HOME_CONFIG, type HomeConfig } from '@xin-via/shared';

/** Cấu hình trang chủ do admin đặt (hero, chữ gợi ý, chip lọc…); chưa tải được thì dùng mặc định để giao diện không trống. */
export function useHomeConfig(): HomeConfig {
  const { data } = useGetHomeQuery();
  return data?.layout.config ?? DEFAULT_HOME_CONFIG;
}
