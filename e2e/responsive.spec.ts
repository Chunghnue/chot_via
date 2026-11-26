import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll, shown, VIEWPORT_PAGES } from './support';

test.describe('responsive: không tràn ngang trên mọi trang chính', () => {
  for (const [name, url] of VIEWPORT_PAGES) {
    test(`${name} (${url})`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(url, { waitUntil: 'networkidle' });
      await expect(page.locator('main, [id=main]').first()).toBeVisible();
      await expectNoHorizontalScroll(page);
      expect(errors).toEqual([]);
    });
  }
});

test.describe('khung điều hướng theo kích thước (RESP-01)', () => {
  test('điện thoại: thanh dưới 5 mục có nút (+) Đăng bài ở giữa; từ iPad dọc: menu trên, không có thanh dưới', async ({ page, isMobile, viewport }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const bottom = page.locator('nav[aria-label="Điều hướng chính"].fixed');
    if (isMobile) {
      await expect(bottom).toBeVisible();
      const labels = await bottom.locator('a, button').allInnerTexts();
      expect(labels.map((l) => l.replace(/[^\p{L}\p{N}\s]/gu, '').trim())).toEqual(['Trang chủ', 'Phố 3D', 'Đăng bài', 'Sự kiện', 'Cá nhân']);
    } else {
      await expect(bottom).toBeHidden();
      const w = viewport?.width ?? 0;
      expect(w).toBeGreaterThanOrEqual(768);
      if (w >= 1024 && w < 1280) {
        // iPad ngang (ảnh b): menu trái 12 mục thay cho menu trên
        const side = page.getByRole('navigation', { name: 'Menu chính' });
        await expect(side).toBeVisible();
        const text = await side.innerText();
        for (const label of [
          'Trang chủ',
          'Ghé phố 3D',
          'Bảng tin chung',
          'Đăng bài',
          'Kể khổ',
          'Khoe doanh thu / Deal',
          'Xin vía Thần Tài',
          'Thử thách',
          'Bảng xếp hạng',
          'Tạo cửa hàng 3D',
          'Cá nhân',
        ])
          expect(text).toContain(label);
      } else {
        const nav = page.locator('header nav').first();
        await expect(nav).toBeVisible();
        expect(await nav.innerText()).not.toContain('Khám phá');
      }
    }
  });

  test('menu trên không có "Khám phá" và có Bảng tin', async ({ page, isMobile, viewport }) => {
    test.skip(isMobile === true, 'điện thoại dùng thanh dưới');
    const w = viewport?.width ?? 0;
    test.skip(w >= 1024 && w < 1280, 'iPad ngang dùng menu trái (ảnh b), đã kiểm ở test trên');
    await page.goto('/', { waitUntil: 'networkidle' });
    const text = await page.getByRole('banner').first().innerText();
    expect(text).toContain('Bảng tin');
    expect(text).not.toContain('Khám phá');
    expect(text).not.toContain('AIBAT');
  });

  test('các khối cột phải vẫn có mặt ở mọi kích thước (không mất chức năng)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const width = page.viewportSize()?.width ?? 0;
    if (width < 768) {
      // điện thoại (ảnh c): thẻ Thần Tài + 3 thẻ lối tắt thay cho cột phải
      await expect(shown(page, 'Xin vía Thần Tài')).toBeVisible();
      await expect(shown(page, 'Thử thách tuần')).toBeVisible();
      await expect(shown(page, 'Bảng xếp hạng')).toBeVisible();
      await expect(shown(page, 'Tạo cửa hàng 3D')).toBeVisible();
    } else if (width >= 1280 && width < 2200) {
      // máy tính (ảnh a): 3 cột — trái Thần Tài/thử thách/tạo cửa hàng, phải BXH tuần
      await expect(shown(page, 'Xin vía Thần Tài')).toBeVisible();
      await expect(shown(page, 'Thử thách tuần')).toBeVisible();
      await expect(shown(page, 'Bảng xếp hạng (Tuần)')).toBeVisible();
    } else {
      await expect(shown(page, 'Xin vía nhanh')).toBeVisible();
      await expect(shown(page, 'Thử thách tuần')).toBeVisible();
      await expect(shown(page, 'Bảng xếp hạng (Tuần)')).toBeVisible();
    }
    await page.goto('/bang-tin?type=story', { waitUntil: 'networkidle' });
    await expect(shown(page, 'Chủ đề hot')).toBeVisible();
    await expect(shown(page, 'Bình chọn vui')).toBeVisible();
    await expect(shown(page, 'Top Kể Khổ tuần')).toBeVisible();
  });
});

test.describe('nhãn cửa hàng trong cảnh phố theo thiết bị (RESP-01)', () => {
  test('thiết bị không có chuột thấy hàng nhãn chạm được; có chuột thì dùng nhãn hover', async ({ page }) => {
    await page.goto('/pho-3d', { waitUntil: 'networkidle' });
    const noHover = await page.evaluate(() => window.matchMedia('(hover: none)').matches);
    const strip = page.getByTestId('shop-strip').first();
    if (noHover) {
      await expect(strip).toBeVisible();
      await strip.getByRole('button', { name: /Mở Quán Cafe An Nhiên/ }).click();
      await expect(page.getByRole('dialog').getByText('Quán Cafe An Nhiên').first()).toBeVisible();
    } else {
      await expect(strip).toBeHidden();
    }
  });

  test('điện thoại luôn là thiết bị không có chuột và có hàng nhãn', async ({ page, isMobile }) => {
    test.skip(isMobile !== true, 'chỉ áp dụng cho dự án điện thoại');
    await page.goto('/pho-3d', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('shop-strip').first()).toBeVisible();
  });
});

test.describe('header iPad ngang (ảnh thiết kế #15)', () => {
  test('từ 1024px (iPad ngang và desktop theo ảnh mới): ô tìm kiếm nằm bên phải menu, kính lúp ở cuối ô; nút "Đăng nhập / Đăng ký" từ 1100px', async ({ page, viewport }) => {
    const w = viewport?.width ?? 0;
    test.skip(w < 1024, 'chỉ áp dụng từ iPad ngang');
    await page.goto('/', { waitUntil: 'networkidle' });
    const search = await page.getByRole('search').boundingBox();
    if (w < 1280) {
      // iPad ngang (ảnh b): không có menu trên, ô tìm kiếm rộng cạnh logo
      expect(search && search.width > 300).toBe(true);
    } else {
      const nav = await page.locator('header nav').first().boundingBox();
      expect(nav && search && search.x >= nav.x + nav.width - 1).toBe(true);
    }
    const icon = await page.getByRole('search').locator('svg').boundingBox();
    expect(icon && search && icon.x > search.x + search.width / 2).toBe(true);
    if (w >= 1100) await expect(page.getByRole('banner').first().getByRole('button', { name: 'Đăng nhập / Đăng ký' })).toBeVisible();
  });
});

test.describe('bảng tin cộng đồng ở trang chủ (ảnh thiết kế)', () => {
  test('4 chip lọc (Tất cả, Kể khổ, Khoe doanh thu, Xin vía) cùng một hàng, giữ chữ "Kể khổ"; có đúng một điều khiển sắp xếp hiển thị', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const feed = page.locator('section[aria-labelledby="feed-title"]');
    const tops: number[] = [];
    for (const name of [/^Tất cả/, /^Kể khổ/, /^Khoe doanh thu/, /^Xin vía/]) {
      const chip = feed.getByRole('button', { name }).first();
      await expect(chip).toBeVisible();
      const box = await chip.boundingBox();
      tops.push(Math.round(box?.y ?? -1));
    }
    expect(new Set(tops).size).toBe(1);
    await expect(feed.getByRole('combobox', { name: 'Mới nhất' })).toHaveCount(1);
    await expectNoHorizontalScroll(page);
  });

  test('thẻ bài ở trang chủ vẫn có nhãn loại bài "Kể khổ" và nút Gửi vía', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const feed = page.locator('section[aria-labelledby="feed-title"]');
    await expect(feed.getByText('Chủ quán Café').first()).toBeVisible();
    await expect(feed.locator('span').filter({ hasText: /^Kể khổ$/, visible: true }).first()).toBeVisible();
    await expect(feed.getByRole('button', { name: /Gửi vía/ }).first()).toBeVisible();
  });
});
