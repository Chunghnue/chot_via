'use client';

import { useTranslations } from 'use-intl';
import type { GlbStreetLabels, StreetSceneProps } from '@chot-via/scene-3d';

/** Nhãn chữ cho cảnh Phố (lấy từ i18n để scene-3d không chứa chữ cứng). */
export function useStreetLabels(): StreetSceneProps['labels'] {
  const t = useTranslations('street');
  const tc = useTranslations('common');
  return {
    deity: t('deity'), deityHint: t('deityHint'), demo: tc('demoLabel'),
    open: (place) => t('open', { place }), wishCount: (count) => t('wishCount', { count }),
  };
}

/** Nhãn cho cảnh phố WebGL (tên Thần Tài, nút điều khiển, gợi ý thao tác). */
export function useGlbLabels(): GlbStreetLabels {
  const t = useTranslations('street');
  return { deity: t('deity'), reset: t('scene.reset'), rotate: t('scene.rotate'), soundOn: t('scene.soundOn'), soundOff: t('scene.soundOff'), hint: t('scene.hint') };
}
