import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll } from './support';

test.describe('trang chủ theo thiết kế: hero ảnh phố, hàng nút, chân trang', () => {
  test('hàng nút hành động theo 3 ảnh: điện thoại 6 nút, iPad 5 nút, máy tính 6 nút', async ({ page, viewport }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const row = page.getByRole('navigation', { name: 'Hành động chính' });
    const width = viewport?.width ?? 0;
    const ipad = width >= 768 && width < 1280;
    const buttons = row.locator('a:visible, button:visible');
    await expect(buttons).toHaveCount(ipad ? 5 : 6);
    const names = width < 768
      ? [/Ghé phố/, /Gửi vía/, /Nhận vía/, /Kể khổ/, /Khoe doanh thu|Khoe deal/, /Tạo cửa hàng 3D/]
      : ipad
        ? [/Ghé phố 3D/, /Kể khổ/, /Khoe doanh thu|Khoe deal/, /Gửi vía/, /Tạo cửa hàng 3D/]
        : [/Kể khổ/, /Khoe doanh thu|Khoe deal/, /Gửi vía/, /Nhận vía/, /Thử thách/, /Tạo cửa hàng 3D/];
    for (const name of names) await expect(row.getByText(name).first()).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('bấm vùng cửa hàng trên ảnh phố mở trang cửa hàng; bấm Thần Tài mở hộp Xin vía', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) < 1024, 'trên điện thoại/iPad dọc ảnh phố bị cắt hai bên');
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Mở Quán Cafe/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Thần Tài' }).first().click({ force: true });
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('"Ghé phố 3D" bật/tắt chế độ 3D mà không làm mất nút Xin vía', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const toggle = page.getByRole('button', { name: /^(Ghé phố 3D|Về ảnh phố)$/ });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: /Xin vía hôm nay/ }).first()).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });
});
