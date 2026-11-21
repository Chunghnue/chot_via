import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll, loginPhoneField, loginViaUi } from './support';

test.describe('thành viên: đăng nhập đúng lúc, giữ bản nháp', () => {
  test('soạn Kể khổ khi chưa đăng nhập → bấm Đăng thì mới hỏi đăng nhập → bản nháp còn nguyên → đăng thành công', async ({ page }) => {
    const text = `Kể khổ E2E ${Date.now()}`;
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Kể khổ/ }).first().click();
    const composer = page.getByRole('dialog');
    await expect(composer.getByText('Soạn bài đăng')).toBeVisible();
    await expect(page.getByRole('dialog').getByPlaceholder('Số điện thoại')).toHaveCount(0);
    await composer.getByRole('textbox').first().fill(text);
    await composer.getByRole('button', { name: 'Đăng bài' }).click();
    await expect(loginPhoneField(page)).toBeVisible();
    await loginViaUi(page);
    await expect(loginPhoneField(page)).toHaveCount(0);
    const draft = page.getByRole('dialog').getByRole('textbox').first();
    await expect(draft).toHaveValue(text);
    await page.getByRole('dialog').getByRole('button', { name: 'Đăng bài' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.goto('/bang-tin?type=story', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Mới nhất' }).click();
    await expect(page.getByText(text)).toBeVisible();
  });

  test('chọn loại bài: chỉ có Kể khổ, Khoe doanh thu, Khoe deal (không có "Xin vía")', async ({ page }) => {
    await page.goto('/bang-tin', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Đăng bài/ }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Đăng bài mới')).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Kể khổ/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Khoe doanh thu/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Khoe deal/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^Xin vía/ })).toHaveCount(0);
  });

  test('thành viên: cá nhân hiện điểm vía; xin vía được +1 điểm và đồng bộ', async ({ page }) => {
    await page.goto('/ca-nhan', { waitUntil: 'networkidle' });
    await page.getByRole('main').getByRole('button', { name: /Đăng nhập/ }).first().click();
    await loginViaUi(page);
    await expect(page.getByText('0 điểm vía')).toBeVisible();
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Xin vía/ }).first().click();
    const card = page.getByTestId('wish-card');
    await expect(card.getByRole('heading', { name: 'Thần Tài đã cho vía!' })).toBeVisible();
    await expect(card.getByText('+1 điểm vía')).toBeVisible();
    await page.goto('/ca-nhan', { waitUntil: 'networkidle' });
    await expect(page.getByText('1 điểm vía')).toBeVisible();
    for (const tile of ['Cửa hàng 3D của tôi', 'Bài đăng', 'Thành tích', 'Yêu thích']) await expect(page.getByText(tile, { exact: true }).first()).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('Tạo cửa hàng 3D: màn giới thiệu ai cũng xem; bấm tạo mới hỏi đăng nhập', async ({ page }) => {
    await page.goto('/tao-diem', { waitUntil: 'networkidle' });
    await expect(page.getByText('Sở hữu cửa hàng 3D riêng')).toBeVisible();
    await page.getByRole('button', { name: 'Tạo cửa hàng ngay' }).click();
    await expect(loginPhoneField(page)).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Đăng nhập để tạo cửa hàng 3D');
  });
});
