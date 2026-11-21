import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll } from './support';

test.describe('trang chủ theo thiết kế: hero thành phố 3D, hàng nút, chân trang', () => {
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

  test('hero là thành phố 3D ngay khi mở trang: có canvas, không còn nút Ghé phố 3D / Về ảnh phố, có nút điều khiển góc nhìn', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const hero = page.getByRole('region', { name: /Phố Chốt Vía 3D/ });
    await expect(hero.locator('canvas')).toBeVisible();
    await expect(page.getByRole('button', { name: /^(Ghé phố 3D|Về ảnh phố)$/ })).toHaveCount(0);
    const controls = hero.getByRole('group', { name: 'Điều khiển góc nhìn phố 3D' });
    for (const name of ['Xoay sang trái', 'Xoay sang phải', 'Đi tới', 'Đi lùi', 'Phóng to', 'Thu nhỏ']) await controls.getByRole('button', { name }).click();
    await expect(hero.getByRole('button', { name: /Xin vía hôm nay/ })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('bấm Thần Tài trong cảnh 3D nổ vía ngay (không hộp thoại)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const canvas = page.getByRole('region', { name: /Phố Chốt Vía 3D/ }).locator('canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(4000); // chờ ảnh Thần Tài tải vào cảnh
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.42);
    await expect(page.getByTestId('wish-card')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('bấm cửa hàng trong cảnh phố ở Phố 3D mở thẻ điểm', async ({ page }) => {
    await page.goto('/pho-3d', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Mở Quán Cafe/ }).first().dispatchEvent('click');
    await expect(page.getByRole('dialog').getByText('Quán Cafe An Nhiên').first()).toBeVisible();
  });
});
