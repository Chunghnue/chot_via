import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PlaceSummary } from '@chot-via/shared';
import { viMessages } from '@chot-via/shared/i18n';
import { IntlProvider } from 'use-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StreetStage } from '../src/components/home/street-stage';

const place = (modelKey: PlaceSummary['modelKey'], title: string, wishCount: number): PlaceSummary => ({
  id: `id-${modelKey}`,
  slug: modelKey,
  kind: modelKey === 'sale_office' ? 'sale_office' : 'store',
  title,
  tagline: null,
  categoryId: 'c',
  categoryName: 'x',
  coverUrl: null,
  sceneTemplateId: 's',
  modelKey,
  isDemo: true,
  ownerName: null,
  wishCount,
  likeCount: 0,
  followCount: 0,
  visitCount: 0,
  autoReplyEnabled: true,
  sortOrder: 0,
  createdAt: new Date().toISOString(),
});
const labels = { deity: 'Thần Tài', deityHint: 'hint', demo: 'Mẫu', open: (p: string) => `Mở ${p}`, wishCount: (n: number) => `${n} vía` };
const places = [place('cafe', 'Quán Cafe An Nhiên', 12500), place('fashion', 'Shop Thời Trang', 1), place('sale_office', 'Team Sale', 3800)];

function renderStage(extra: Partial<Parameters<typeof StreetStage>[0]> = {}) {
  const onSelectPlace = vi.fn();
  const onSelectDeity = vi.fn();
  render(
    <IntlProvider locale="vi" messages={viMessages}>
      <StreetStage places={places} labels={labels} onSelectPlace={onSelectPlace} onSelectDeity={onSelectDeity} {...extra} />
    </IntlProvider>,
  );
  return { onSelectPlace, onSelectDeity };
}

afterEach(cleanup);

describe('cảnh Phố Xin Vía (StreetStage)', () => {
  it('chạm cửa hàng mở đúng điểm; chạm Thần Tài mở popup xin vía', () => {
    const { onSelectPlace, onSelectDeity } = renderStage();
    fireEvent.click(screen.getByRole('button', { name: 'Mở Quán Cafe An Nhiên' }));
    expect(onSelectPlace).toHaveBeenCalledWith('id-cafe');
    fireEvent.click(screen.getByRole('button', { name: 'Thần Tài' }));
    expect(onSelectDeity).toHaveBeenCalledTimes(1);
  });

  it('cửa hàng chưa có trong dữ liệu vẫn hiện hình nhưng không bấm được', () => {
    renderStage();
    expect(screen.queryByRole('button', { name: /Mở .*Nhà hàng/ })).toBeNull();
    expect(screen.getAllByRole('button', { name: /^Mở / })).toHaveLength(3);
  });

  it('nhãn nổi hiện tên và số vía rút gọn (12.5k vía) khi bật showChips', () => {
    renderStage({ showChips: true });
    expect(screen.getByText(/12\.5k vía/)).toBeTruthy();
    expect(screen.getByText(/3\.8k vía/)).toBeTruthy();
  });

  it('khi lọc, cửa hàng không khớp bị làm mờ (dimMissing)', () => {
    renderStage({ dimMissing: true });
    const dimmed = document.querySelectorAll('img.opacity-35');
    expect(dimmed.length).toBeGreaterThan(0);
  });
});
