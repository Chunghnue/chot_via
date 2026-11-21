import { expect, test } from '@playwright/test';

test.describe('PWA trên bản production', () => {
  test('manifest và icon hợp lệ', async ({ page, request }) => {
    const res = await request.get('/manifest.webmanifest');
    expect(res.status()).toBe(200);
    const m = (await res.json()) as { name: string; display: string; start_url: string; theme_color: string; icons: { src: string; sizes: string; purpose?: string }[] };
    expect(m.display).toBe('standalone');
    expect(m.start_url).toBe('/');
    expect(m.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(m.icons.map((i) => i.sizes).sort()).toEqual(['192x192', '512x512', '512x512']);
    expect(m.icons.some((i) => i.purpose === 'maskable')).toBe(true);
    for (const icon of m.icons) expect((await request.get(icon.src)).status(), icon.src).toBe(200);
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(await page.locator('link[rel="manifest"]').count()).toBe(1);
  });

  test('đăng ký service worker; mất mạng vẫn mở được app và xin vía bằng lời chúc dự phòng (không khẳng định đã ghi nhận)', async ({ page, context }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload({ waitUntil: 'networkidle' }); // lần tải này đã do service worker kiểm soát: lưu vỏ app, file chạy và gói lời chúc offline
    await expect.poll(async () => page.evaluate(async () => (await caches.keys()).length)).toBeGreaterThan(0);
    await expect.poll(async () => page.evaluate(async () => { const c = await caches.keys(); let hit = false; for (const k of c) if (await (await caches.open(k)).match('/api/v1/wishes/offline-pack')) hit = true; return hit; })).toBe(true);

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    const hero = page.getByRole('button', { name: /Xin vía hôm nay/ }).first();
    await expect(hero).toBeVisible();
    await hero.click();
    const card = page.getByTestId('wish-card');
    await expect(card.getByRole('heading', { name: 'Thần Tài đã cho vía!' })).toBeVisible();
    await expect(card.getByText(/Lời chúc dự phòng/).first()).toBeVisible();
    await context.setOffline(false);
  });
});
