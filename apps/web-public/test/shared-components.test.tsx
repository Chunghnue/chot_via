import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppIntlProvider, ConfirmPanel, FormField, IconButton, RankRow, SectionTitle, SwitchField, Tabs, ToggleTile, useConfirm } from '@chot-via/ui';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

describe('Tabs dùng chung', () => {
  const items = [{ key: 'a', label: 'Thử thách' }, { key: 'b', label: 'Sự kiện' }, { key: 'c', label: 'Cộng đồng' }] as const;

  it.each(['pill', 'underline', 'chips'] as const)('kiểu %s: có role tab, đánh dấu mục đang chọn và gọi onChange', (variant) => {
    const onChange = vi.fn();
    render(<Tabs variant={variant} items={items} value="b" onChange={onChange} />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'Sự kiện' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Thử thách' }).getAttribute('aria-selected')).toBe('false');
    fireEvent.click(screen.getByRole('tab', { name: 'Cộng đồng' }));
    expect(onChange).toHaveBeenCalledWith('c');
  });
});

describe('ConfirmProvider / useConfirm (thay hộp xác nhận của trình duyệt)', () => {
  function Probe({ onResult }: { onResult: (value: boolean) => void }) {
    const confirm = useConfirm();
    return <button type="button" onClick={() => { void confirm({ title: 'Xóa mục này?', confirmLabel: 'Xóa' }).then(onResult); }}>mở</button>;
  }
  const setup = () => {
    const onResult = vi.fn();
    render(<AppIntlProvider><Probe onResult={onResult} /></AppIntlProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'mở' }));
    return onResult;
  };

  it('bấm nút xác nhận trả về true', async () => {
    const onResult = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Xóa' }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
  });

  it('bấm Hủy trả về false và đóng hộp', async () => {
    const onResult = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Hủy' }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('ConfirmPanel gọi đúng callback', () => {
    const onConfirm = vi.fn(); const onCancel = vi.fn();
    render(<ConfirmPanel title="Bỏ bản nháp?" confirmLabel="Bỏ" cancelLabel="Giữ lại" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Giữ lại' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('Biểu mẫu dùng chung', () => {
  it('FormField gắn nhãn với ô nhập và hiện lỗi', () => {
    render(<FormField label="Tên cửa hàng" htmlFor="title" error="Bắt buộc"><input id="title" /></FormField>);
    expect(screen.getByLabelText('Tên cửa hàng')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Bắt buộc');
  });

  it('SwitchField là công tắc có tên, luôn điều khiển được và đổi giá trị', () => {
    function Host() {
      const [on, setOn] = useState(false);
      return <SwitchField label="Hiện dữ liệu mẫu" checked={on} onCheckedChange={setOn} />;
    }
    render(<Host />);
    const toggle = screen.getByRole('switch', { name: 'Hiện dữ liệu mẫu' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });

  it('ToggleTile báo trạng thái chọn bằng aria-pressed; IconButton luôn có tên truy cập', () => {
    const onClick = vi.fn();
    render(<><ToggleTile active tone="solid" onClick={onClick}>Tài lộc</ToggleTile><ToggleTile active={false}>Bình an</ToggleTile><IconButton label="Đóng" onClick={onClick}>x</IconButton></>);
    expect(screen.getByRole('button', { name: 'Tài lộc' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Bình an' }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('SectionTitle và RankRow', () => {
  it('SectionTitle hiện tiêu đề, mô tả và hành động bên phải', () => {
    render(<SectionTitle icon="/images/ic-trophy.webp" title="Bảng xếp hạng" sub="Theo điểm vía" action={<a href="/x">Xem thêm</a>} />);
    expect(screen.getByRole('heading', { name: 'Bảng xếp hạng' })).toBeTruthy();
    expect(screen.getByText('Theo điểm vía')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Xem thêm' })).toBeTruthy();
  });

  it('RankRow: top 3 là huy chương, từ hạng 4 là số; có liên kết do app truyền vào', () => {
    const row = (rank: number) => <RankRow key={rank} rank={rank} avatar={{ src: null, name: `Người ${rank}` }} title={`Người ${rank}`} value={`${rank * 10} điểm`} render={(className, children) => <a href={`/u/${rank}`} className={className}>{children}</a>} />;
    const { container } = render(<>{[1, 3, 4].map(row)}</>);
    expect(container.querySelectorAll('img[src*="ic-medal"]')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /Người 4/ }).textContent).toContain('4');
    expect(screen.getByRole('link', { name: /Người 1/ }).getAttribute('href')).toBe('/u/1');
  });
});
