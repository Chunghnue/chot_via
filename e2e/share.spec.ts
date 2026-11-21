import { expect, test } from '@playwright/test';

test.describe('chia sẻ lời chúc', () => {
  test('thẻ lời chúc xin vía có nút Facebook / Zalo / TikTok; bấm Facebook mở cửa sổ chia sẻ', async ({ page, context }) => {
    await context.route(/facebook\.com|zalo\.me|tiktok\.com/, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>mạng xã hội</title>' }));
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /(hôm|sáng|chiều|tối) nay/ }).first().click();
    const card = page.getByTestId('wish-card');
    await expect(card).toBeVisible();
    for (const name of ['Chia sẻ lên Facebook', 'Chia sẻ lên Zalo', 'Mở TikTok để dán lời chúc']) await expect(card.getByRole('button', { name })).toBeVisible();
    const popup = page.waitForEvent('popup');
    await card.getByRole('button', { name: 'Chia sẻ lên Facebook' }).click();
    expect((await popup).url()).toContain('facebook.com/sharer');
  });
});
