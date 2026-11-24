import { expect, test } from '@playwright/test';
import { apiLogin, API } from './support';

test.describe('phiên đăng nhập dùng chung với web admin', () => {
  test('mở web public lúc chưa đăng nhập, đăng nhập ở nơi khác (cùng cookie) rồi quay lại tab → tự nhận phiên, không cần tải lại', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) < 1100, 'nút Đăng nhập ở thanh trên chỉ hiện từ 1100px');
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /Đăng nhập/ }).first()).toBeVisible();
    await apiLogin(page.context().request);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.getByRole('button', { name: /Đăng nhập/ })).toHaveCount(0, { timeout: 15_000 });
  });
  test('đăng xuất ở nơi khác (cùng cookie) rồi quay lại tab → tự về khách, không cần tải lại', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) < 1100, 'nút Đăng nhập ở thanh trên chỉ hiện từ 1100px');
    await apiLogin(page.context().request);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /Đăng nhập/ })).toHaveCount(0);
    const out = await page.context().request.post(`${API}/auth/logout`, { headers: { 'x-requested-with': 'chotvia' } });
    expect(out.status()).toBeLessThan(300);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.getByRole('button', { name: /Đăng nhập/ }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('web admin: đăng nhập rồi đăng xuất ở nơi khác (cùng cookie) → admin tự đổi trạng thái khi quay lại tab', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) < 1400, 'Chỉ chạy một lần ở desktop.');
    await page.goto('http://localhost:5273/', { waitUntil: 'networkidle' });
    await expect(page.locator('#phone')).toBeVisible();
    await apiLogin(page.context().request);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.locator('#phone')).toHaveCount(0, { timeout: 15_000 });
    await page.waitForTimeout(3200); // khoảng chờ tối thiểu giữa hai lần hỏi lại phiên
    expect((await page.context().request.post(`${API}/auth/logout`, { headers: { 'x-requested-with': 'chotvia' } })).status()).toBeLessThan(300);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.locator('#phone')).toBeVisible({ timeout: 15_000 });
  });
});
