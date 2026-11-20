import { expect, test } from '@playwright/test';

test.describe('web admin', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1400, 'Chỉ chạy một lần ở desktop (OTP admin giới hạn 3 lần/15 phút).');

  test('đăng nhập admin, tạo bài mẫu và bật/tắt công tắc dữ liệu mẫu hiển thị trên app', async ({ page, request, context }) => {
    await page.goto('http://localhost:5273/', { waitUntil: 'networkidle' });
    const H = { 'x-requested-with': 'chotvia', 'content-type': 'application/json' };
    expect((await context.request.post('http://localhost:5273/api/v1/auth/otp/request', { headers: H, data: { phone: '0900000000' } })).status()).toBe(201);
    expect((await context.request.post('http://localhost:5273/api/v1/auth/otp/verify', { headers: H, data: { phone: '0900000000', code: '123456' } })).status()).toBe(201);
    await page.goto('http://localhost:5273/demo/posts', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Bài đăng mẫu' })).toBeVisible();
    await expect(page.getByText('Lan Anh').first()).toBeVisible();

    await page.goto('http://localhost:5273/demo/users', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Tài khoản mẫu' })).toBeVisible();
    await page.goto('http://localhost:5273/catalog/hot-topics', { waitUntil: 'networkidle' });
    await expect(page.getByText('Làm sale có nên nghỉ Tết sớm?')).toBeVisible();

    await page.goto('http://localhost:5273/settings', { waitUntil: 'networkidle' });
    const toggle = page.getByRole('switch', { name: /Hiện dữ liệu mẫu/ });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await page.getByRole('button', { name: /Lưu/ }).first().click();
    await expect.poll(async () => (await request.get('http://localhost:3101/api/v1/places')).json().then((j: { data: unknown[] }) => j.data.filter((p) => (p as { isDemo: boolean }).isDemo).length)).toBe(0);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByText('Lan Anh')).toHaveCount(0);

    await page.goto('http://localhost:5273/settings', { waitUntil: 'networkidle' });
    await page.getByRole('switch', { name: /Hiện dữ liệu mẫu/ }).click();
    await page.getByRole('button', { name: /Lưu/ }).first().click();
    await expect.poll(async () => (await request.get('http://localhost:3101/api/v1/places')).json().then((j: { data: unknown[] }) => j.data.length)).toBeGreaterThanOrEqual(6);
  });
});
