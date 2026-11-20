import { expect, test } from '@playwright/test';
import { apiLogin, VIEWPORT_PAGES } from './support';

/** Thành viên đã có phiên mở thẳng từng trang: HTML máy chủ và trình duyệt phải khớp (phiên có thể khôi phục xong trước lúc một khối hydrate). */
test.describe('hydrate khi đã đăng nhập', () => {
  test('mở thẳng các trang chính: không có lỗi hydrate hoặc lỗi chạy', async ({ page }) => {
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
    page.on('console', (m) => { if (m.type() === 'error' && /hydrat/i.test(m.text())) problems.push(`console: ${m.text().slice(0, 200)}`); });
    await apiLogin(page.context().request);
    for (const [, url] of VIEWPORT_PAGES) await page.goto(url, { waitUntil: 'networkidle' });
    expect(problems).toEqual([]);
  });
});
