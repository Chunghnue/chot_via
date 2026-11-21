import { expect, test } from '@playwright/test';
import { apiLogin, expectNoHorizontalScroll } from './support';

test.describe('trang chủ theo thiết kế: hero thành phố 3D, hàng nút, chân trang', () => {
  test('hàng nút hành động: khách chỉ thấy Kể khổ và Khoe doanh thu / Deal (Đốt vía và Thỉnh Thần Tài chỉ hiện khi đăng nhập); không còn Thử thách, Tạo cửa hàng 3D', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const row = page.getByRole('navigation', { name: 'Hành động chính' });
    await expect(row.locator('a:visible, button:visible')).toHaveCount(2);
    await expect(row.getByText(/Kể khổ/).first()).toBeVisible();
    await expect(row.getByText(/Khoe doanh thu|Khoe deal/).first()).toBeVisible();
    for (const gone of [/Thử thách/, /Tạo cửa hàng 3D/, /Ghé phố/]) await expect(row.getByText(gone)).toHaveCount(0);
    await expect(page.getByTestId('action-burn')).toHaveCount(0);
    await expect(page.getByTestId('action-invoke')).toHaveCount(0);
    await expectNoHorizontalScroll(page);
  });

  test('thành viên: hàng nút theo thứ tự Kể khổ → Đốt vía → Thỉnh Thần Tài → Khoe doanh thu; Đốt vía và Thỉnh Thần Tài cao bằng nhau và cao hơn nút khác', async ({ page }) => {
    await apiLogin(page.context().request);
    await page.goto('/', { waitUntil: 'networkidle' });
    const row = page.getByRole('navigation', { name: 'Hành động chính' });
    const buttons = row.locator('a:visible, button:visible');
    await expect(buttons).toHaveCount(4);
    const texts = await buttons.allInnerTexts();
    expect(texts.map((t) => t.split('\n')[0]?.trim())).toEqual([expect.stringMatching(/Kể khổ/), 'Đốt vía', 'Thỉnh Thần Tài', expect.stringMatching(/Khoe doanh thu|Khoe deal/)]);
    const heights = await buttons.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(Math.abs((heights[1] ?? 0) - (heights[2] ?? 0))).toBeLessThan(1);
    expect(heights[1] ?? 0).toBeGreaterThan(heights[0] ?? 99);
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
