import { expect, test } from '@playwright/test';

import { API, apiLogin, headers } from './support';

test.describe('chuông thông báo', () => {
  test('khách bấm chuông thì mở hộp đăng nhập, không có số', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const bell = page.getByRole('banner').first().getByRole('link', { name: 'Thông báo' });
    await expect(bell).toBeVisible();
    await expect(bell.locator('span')).toHaveCount(0);
    await bell.click();
    await expect(page.getByPlaceholder('Nhập số điện thoại của bạn')).toBeVisible();
  });

  test('thành viên: số chưa đọc → trang Thông báo → bấm từng thông báo giảm số → "Đánh dấu đã đọc" xóa hết', async ({ page, request }) => {
    const a = await apiLogin(page.context().request);
    const b = await apiLogin(request);
    const created = await request.post(`${API}/posts`, { headers: { ...headers(), authorization: `Bearer ${a.token}` }, data: { type: 'story', body: `Bài nhận thông báo ${Date.now()}` } });
    const postId = ((await created.json()) as { data: { id: string } }).data.id;
    const bAuth = { ...headers(), authorization: `Bearer ${b.token}` };
    expect((await request.post(`${API}/posts/${postId}/comments`, { headers: bAuth, data: { body: 'Hay quá!' } })).status()).toBe(201);
    expect((await request.put(`${API}/posts/${postId}/reaction`, { headers: bAuth, data: { type: 'love' } })).status()).toBeLessThan(300);

    await page.goto('/', { waitUntil: 'networkidle' });
    const bell = page.getByRole('banner').first().getByRole('link', { name: 'Thông báo' });
    await expect(bell).toContainText('2');

    await bell.click();
    await expect(page).toHaveURL(/\/thong-bao/);
    await expect(page.getByText('đã bình luận bài viết của bạn')).toBeVisible();
    await expect(page.getByText('đã thả cảm xúc vào bài viết của bạn')).toBeVisible();

    await page.getByText('đã bình luận bài viết của bạn').click();
    await expect(page).toHaveURL(new RegExp(`/bai/${postId}`));
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('banner').first().getByRole('link', { name: 'Thông báo' })).toContainText('1');

    await page.goto('/thong-bao', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Đánh dấu đã đọc' }).click();
    await expect(page.getByRole('button', { name: 'Đánh dấu đã đọc' })).toHaveCount(0);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('banner').first().getByRole('link', { name: 'Thông báo' }).locator('span')).toHaveCount(0);
  });
});
