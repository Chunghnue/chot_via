import { expect, test } from '@playwright/test';
import { apiLogin } from './support';

test.describe('phiên đăng nhập dùng chung với web admin', () => {
  test('mở web public lúc chưa đăng nhập, đăng nhập ở nơi khác (cùng cookie) rồi quay lại tab → tự nhận phiên, không cần tải lại', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) < 1100, 'nút Đăng nhập ở thanh trên chỉ hiện từ 1100px');
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /Đăng nhập/ }).first()).toBeVisible();
    await apiLogin(page.context().request);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.getByRole('button', { name: /Đăng nhập/ })).toHaveCount(0, { timeout: 15_000 });
  });
});
