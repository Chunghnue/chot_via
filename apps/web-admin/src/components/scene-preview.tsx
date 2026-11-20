import { useGetHomeQuery } from '@chot-via/api-client';
import type { HomeConfig } from '@chot-via/shared';
import { GlbStreetView } from '@chot-via/scene-3d';
import { useTranslations } from 'use-intl';

/** Xem trước cảnh Phố 3D ngay trong admin theo giá trị đang sửa (chưa cần lưu). Chỉ nạp khi mở mục này vì kéo theo three.js. */
export default function ScenePreview({ config }: { config: HomeConfig }) {
  const t = useTranslations('admin.homeConfig');
  const { data: home } = useGetHomeQuery();
  const labels = {
    deity: t('previewDeity'), reset: t('previewReset'), rotate: t('previewRotate'), soundOn: t('previewSoundOn'), soundOff: t('previewSoundOff'), hint: t('previewHint'),
  };
  if (!home) return null;
  return (
    <div className="relative aspect-[2.2/1] w-full overflow-hidden rounded-2xl bg-surface-muted">
      <GlbStreetView
        className="absolute inset-0" config={config} slots={home.layout.street} labels={labels}
        onSelectPlace={() => undefined} onSelectDeity={() => undefined}
        fallback={<div className="grid size-full place-items-center text-sm text-ink-muted">{t('previewFailed')}</div>}
      />
    </div>
  );
}
