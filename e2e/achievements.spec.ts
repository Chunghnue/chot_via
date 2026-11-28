import { expect, test } from '@playwright/test';
import { API, apiLogin, headers } from './support';

/** SRS mục 17: UAT-09 (Sale chọn Khoe) và UAT-10 (chủ quán chọn Khoe): có mẫu theo vai trò và tùy chọn ẩn giá trị. */
test.describe('Khoe doanh thu / Deal theo vai trò', () => {
  async function openBrag(page: import('@playwright/test').Page, request: import('@playwright/test').APIRequestContext) {
    await apiLogin(request);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Khoe doanh thu / Deal', exact: true }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Bạn là ai?')).toBeVisible();
    return dialog;
  }

  test('UAT-10 chủ quán: mẫu doanh thu / số đơn / ngày bán tốt / mốc; mặc định ẩn số tiền; đăng không lộ số', async ({ page }) => {
    const dialog = await openBrag(page, page.context().request);
    await dialog.getByRole('button', { name: 'Chủ quán' }).click();
    for (const m of ['Doanh thu hôm nay', 'Số đơn', 'Ngày bán tốt', 'Mốc kinh doanh']) await expect(dialog.getByRole('button', { name: m })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Deal' })).toHaveCount(0);
    await expect(dialog.getByRole('radio', { name: /Ẩn số tiền/ })).toBeChecked();
    await expect(dialog.getByRole('radio', { name: /Chỉ hiện khoảng/ })).toBeVisible();
    await expect(dialog.getByRole('radio', { name: /Hiện số chính xác/ })).toBeVisible();

    const body = `Ngày bán tốt ${Date.now()}`;
    await dialog.getByRole('textbox').first().fill(body);
    await dialog.getByRole('button', { name: 'Đăng bài' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.goto('/bang-tin', { waitUntil: 'networkidle' });
    const card = page.locator('main').getByText(body);
    await expect(card).toBeVisible();
    await expect(page.locator('main').getByText('Đã chia sẻ thành tích').first()).toBeVisible();
    const feed = await page.context().request.get(`${API}/posts?pageSize=20`, { headers: headers() });
    const posts = ((await feed.json()) as { data: { body: string; achievement: { displayMode: string; amount: number | null } | null }[] }).data;
    expect(posts.find((p) => p.body === body)?.achievement).toMatchObject({ displayMode: 'hidden', amount: null });
  });

  test('UAT-09 sale: mẫu deal / hợp đồng / KPI / số khách; chọn "Chỉ hiện khoảng" hiện các mức giá trị', async ({ page }) => {
    const dialog = await openBrag(page, page.context().request);
    await dialog.getByRole('button', { name: 'Sale' }).click();
    for (const m of ['Deal', 'Hợp đồng', 'KPI', 'Số khách']) await expect(dialog.getByRole('button', { name: m, exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Doanh thu hôm nay' })).toHaveCount(0);
    await expect(dialog.getByRole('radio', { name: /Ẩn số tiền/ })).toBeChecked();
    await dialog.getByRole('radio', { name: /Chỉ hiện khoảng/ }).check();
    await expect(dialog.getByText('Chọn khoảng')).toBeVisible();
    await dialog.getByRole('radio', { name: /Ẩn số tiền/ }).check();
    await expect(dialog.getByText('Chọn khoảng')).toHaveCount(0);

    const body = `Chốt deal ${Date.now()}`;
    await dialog.getByRole('textbox').first().fill(body);
    await dialog.getByRole('button', { name: 'Đăng bài' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.goto('/bang-tin', { waitUntil: 'networkidle' });
    await expect(page.locator('main').getByText(body)).toBeVisible();
  });
});
