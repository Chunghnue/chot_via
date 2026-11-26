import { expect, test, type Page } from '@playwright/test';
import { API, apiLogin, headers, loginPhoneField } from './support';

/** Đăng nhập thành viên mới (cookie dùng chung với trình duyệt) và tạo sẵn một cửa hàng cho họ. */
async function memberWithStore(page: Page): Promise<void> {
  const request = page.context().request;
  const { token } = await apiLogin(request);
  const h = { ...headers(), authorization: `Bearer ${token}` };
  const catalog = (await (await request.get(`${API}/catalog`, { headers: h })).json()) as { data: { categories: { id: string; kind: string }[]; sceneTemplates: { id: string; kind: string }[] } };
  const category = catalog.data.categories.find((c) => c.kind === 'store');
  const template = catalog.data.sceneTemplates.find((s) => s.kind === 'store');
  expect(category && template).toBeTruthy();
  const made = await request.post(`${API}/places`, {
    headers: h,
    data: {
      kind: 'store',
      title: 'Quán Cafe Phước Lộc',
      tagline: '',
      description: '',
      province: '',
      categoryId: category?.id,
      sceneTemplateId: template?.id,
      autoReplyEnabled: false,
    },
  });
  expect(made.status()).toBe(201);
}

test.describe('Đốt vía và Thỉnh Thần Tài (cho cửa hàng của chính mình)', () => {
  test('khách vẫn thấy hai nút ở trang chủ; bấm vào thì mời đăng nhập (chủ dự án đổi 25/11/2026)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('action-burn')).toBeVisible();
    await expect(page.getByTestId('action-invoke')).toBeVisible();
    await page.getByTestId('action-burn').click();
    await expect(loginPhoneField(page)).toBeVisible();
  });

  test('thành viên chưa có cửa hàng: bấm Đốt vía → dẫn đi tạo cửa hàng → tạo xong hiện hộp có nút bắt đầu → bấm là chạy nghi lễ', async ({ page }) => {
    test.setTimeout(90_000);
    await apiLogin(page.context().request);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByTestId('action-burn').click();
    await expect(page).toHaveURL(/\/tao-diem/);
    await page.getByRole('button', { name: 'Tạo cửa hàng ngay' }).click();
    await page.locator('button[aria-pressed]').first().click();
    await page.locator('#title').fill('Quán Cafe Phước Lộc');
    await page.getByRole('button', { name: 'Tạo điểm' }).click();
    const offer = page.getByTestId('ritual-offer');
    await expect(offer).toBeVisible();
    await expect(offer.getByTestId('ritual-start-burn')).toBeVisible();
    await expect(offer.getByTestId('ritual-start-invoke')).toBeVisible();
    await offer.getByTestId('ritual-start-burn').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('ritual-caption')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('ritual-card')).toContainText('Đã đốt vía cho Quán Cafe Phước Lộc', { timeout: 30_000 });
  });

  test('có cửa hàng: Đốt vía chạy khoảng 10 giây (phụ đề + thẻ lời chúc), không giới hạn số lần', async ({ page }) => {
    test.setTimeout(120_000);
    await memberWithStore(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    for (let round = 0; round < 2; round++) {
      await page.getByTestId('action-burn').click();
      await expect(page.getByTestId('ritual-caption')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('ritual-card')).toContainText('Đã đốt vía cho Quán Cafe Phước Lộc', { timeout: 30_000 });
      await expect(page.getByTestId('ritual-caption')).toHaveCount(0, { timeout: 30_000 });
      await page.getByRole('button', { name: 'Đóng cửa sổ nghi lễ' }).click();
    }
  });

  test('có cửa hàng: Thỉnh Thần Tài chạy khoảng 20 giây rồi hiện lời chúc', async ({ page }) => {
    test.setTimeout(120_000);
    await memberWithStore(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByTestId('action-invoke').click();
    await expect(page.getByTestId('ritual-caption')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('ritual-card')).toContainText('Thần Tài đã ghé Quán Cafe Phước Lộc', { timeout: 40_000 });
  });
});
