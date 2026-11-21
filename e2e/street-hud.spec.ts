import { expect, test } from '@playwright/test';

test.describe('Phố 3D theo ảnh thiết kế (máy tính)', () => {
  test('máy tính: joystick, nút phóng to/thu nhỏ, 7 ô lối tắt, 3 khối bên phải và hàng 5 thẻ dưới', async ({ page, viewport }) => {
    const w = viewport?.width ?? 0;
    test.skip(w < 1280, 'bố cục này chỉ áp dụng từ 1280px');
    await page.goto('/pho-3d', { waitUntil: 'networkidle' });
    await expect(page.getByRole('group', { name: 'Điều khiển góc nhìn' })).toBeVisible();
    for (const name of ['Phóng to', 'Thu nhỏ', 'Toàn màn hình']) await expect(page.getByRole('button', { name })).toBeVisible();
    for (const name of ['Kể khổ', 'Khoe doanh thu', 'Gửi vía', 'Nhận vía']) await expect(page.getByRole('button', { name }).first()).toBeVisible();
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

  test('dưới 1280px không hiện khối joystick và hàng thẻ dưới (giữ bố cục cũ)', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) >= 1280, 'chỉ kiểm dưới 1280px');
    await page.goto('/pho-3d', { waitUntil: 'networkidle' });
    await expect(page.getByRole('group', { name: 'Điều khiển góc nhìn' })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Ghé phố hôm nay' })).toBeHidden();
  });
});
