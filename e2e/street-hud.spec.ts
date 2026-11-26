import { expect, test } from '@playwright/test';

test.describe('Phố 3D theo ảnh thiết kế (máy tính)', () => {
  test('máy tính: nút toàn màn hình, ô lối tắt (khách không thấy Đốt vía / Thỉnh Thần Tài), 3 khối bên phải và hàng 5 thẻ dưới', async ({ page, viewport }) => {
    const w = viewport?.width ?? 0;
    test.skip(w < 1280, 'bố cục này chỉ áp dụng từ 1280px');
    await page.goto('/pho-3d', { waitUntil: 'networkidle' });
    for (const name of ['Toàn màn hình']) await expect(page.getByRole('button', { name })).toBeVisible();
    for (const name of ['Kể khổ', 'Khoe doanh thu']) await expect(page.getByRole('button', { name }).first()).toBeVisible();
    for (const name of ['Tạo cửa hàng 3D', 'Bảng xếp hạng', 'Thử thách']) await expect(page.getByRole('link', { name }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Thần Tài trao vía!' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ghé phố hôm nay' })).toBeVisible();
    for (const name of ['Bảng tin cộng đồng', 'Thử thách tuần', 'Sự kiện nổi bật', 'Cá nhân']) await expect(page.getByRole('heading', { name })).toBeVisible();
  });

  test('máy tính: nút "Nhận vía ngay" trong khối Thần Tài trao vía nổ vía ngay (hiện lời chúc nổi, không hộp thoại)', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) < 1280, 'bố cục này chỉ áp dụng từ 1280px');
    await page.goto('/pho-3d', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Nhận vía ngay' }).click();
    await expect(page.getByTestId('wish-card')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('dưới 1280px: hàng 7 chip lối tắt nằm dưới cảnh phố (không biến mất), vẫn không có cột phải và khối "Ghé phố hôm nay"', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) >= 1280, 'chỉ kiểm dưới 1280px');
    await page.goto('/pho-3d', { waitUntil: 'networkidle' });
    const tiles = page.getByTestId('street-tiles-below');
    await expect(tiles).toBeVisible();
    await expect(tiles.locator('a:visible, button:visible')).toHaveCount(7);
    for (const name of ['Kể khổ', 'Khoe doanh thu', 'Đốt vía', 'Thỉnh Thần Tài', 'Tạo cửa hàng 3D', 'Bảng xếp hạng', 'Thử thách']) await expect(tiles.getByText(name, { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ghé phố hôm nay' })).toBeHidden();
    await expect(page.getByTestId('street-tiles')).toBeHidden();
  });
});
