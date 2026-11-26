import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll, loginPhoneField, shown } from './support';

test.describe('khách: vào là xin vía được ngay', () => {
  test('trang chủ không có màn đăng nhập chặn; nút hero hiện tiêu đề "Xin vía hôm nay" (lần đầu)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Xin vía hôm nay/ }).first()).toBeVisible();
    await expect(page.getByRole('region', { name: /Phố Xin Vía 3D/ })).toBeVisible();
  });

  test('xin vía Thần Tài một chạm: bấm là nổ ngay, hiện lời chúc nổi và liên kết sang Phố 3D; không hộp thoại, không bước xác nhận, không đòi đăng nhập', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Xin vía hôm nay/ }).first().click();
    await expect(page.getByTestId('wish-burst')).toBeAttached();
    const card = page.getByTestId('wish-card');
    await expect(card.getByRole('heading', { name: 'Thần Tài đã cho vía!' })).toBeVisible();
    await expect(card.getByRole('link', { name: /Gửi vía cho cửa hàng khác trong Phố 3D/ })).toBeVisible();
    await expect(card.getByText(/lịch sử/i)).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Đã nhận vía!' })).toHaveCount(0);
    await card.getByRole('button', { name: 'Đóng lời chúc' }).click();
    await expect(card).toHaveCount(0);
  });

  test('bấm liền hai lần chỉ ghi nhận một lượt xin vía (nút bị khóa trong lúc đang nổ)', async ({ page }) => {
    let calls = 0;
    page.on('request', (r) => { if (r.method() === 'POST' && r.url().includes('/wishes/deity')) calls += 1; });
    await page.goto('/', { waitUntil: 'networkidle' });
    const hero = page.getByRole('button', { name: /Xin vía (hôm|sáng|chiều|tối) nay/ }).first();
    // Hai lần bấm liên tiếp bắn thẳng lên nút (không bấm theo tọa độ: thẻ lời chúc nổi có thể đè lên nút ở một số kích thước màn hình).
    await hero.dispatchEvent('click');
    await hero.dispatchEvent('click');
    await expect(page.getByTestId('wish-card')).toBeVisible();
    expect(calls).toBe(1);
  });

  test('sau lần xin vía đầu, nút hero đổi sang tiêu đề theo buổi (sáng/chiều/tối nay)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Xin vía hôm nay/ }).first().click();
    await expect(page.getByTestId('wish-card')).toBeVisible();
    await expect(page.getByRole('button', { name: /Xin vía (sáng|chiều|tối) nay/ }).first()).toBeVisible();
  });

  test('chạm cửa hàng trong cảnh phố → chi tiết → gửi vía → nhận phản hồi tự động có nhãn', async ({ page }) => {
    await page.goto('/pho-3d', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Mở Quán Cafe An Nhiên/ }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Quán Cafe An Nhiên').first()).toBeVisible();
    await dialog.getByRole('button', { name: /Gửi vía/ }).first().click();
    await dialog.getByRole('button', { name: /Đông khách/ }).click();
    await dialog.getByRole('button', { name: 'Gửi vía ngay' }).click();
    await expect(dialog.getByText('Phản hồi tự động').first()).toBeVisible();
  });

  test('bảng xếp hạng: 3 tab, Cửa hàng/Sale theo số vía, Cộng đồng theo điểm', async ({ page }) => {
    await page.goto('/bang-xep-hang', { waitUntil: 'networkidle' });
    await expect(page.getByRole('tab', { name: 'Cửa hàng' })).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'Cửa hàng' })).toBeVisible();
    await expect(shown(page, 'Quán Cafe An Nhiên')).toBeVisible();
    await page.getByRole('tab', { name: 'Sale' }).click();
    await expect(shown(page, /Team Sale|Văn phòng Sale/)).toBeVisible();
    await page.getByRole('tab', { name: 'Cộng đồng' }).click();
    await expect(shown(page, 'TOP THÀNH VIÊN XIN VÍA')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('trang cửa hàng: 4 tab, nút nổi, "Xin vía cho quán"; thích cần đăng nhập đúng lúc', async ({ page }) => {
    await page.goto('/diem/quan-cafe-an-nhien', { waitUntil: 'networkidle' });
    for (const tab of ['Bảng tin', 'Giới thiệu', 'Hình ảnh', 'Thành tích']) await expect(page.getByRole('tab', { name: tab })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xin vía cho quán' })).toBeVisible();
    // Nút Thích của cửa hàng có kèm số lượt; các nút Thích trên thẻ bài trong tab Bảng tin chỉ có nhãn "Thích".
    await page.getByRole('button', { name: /^Thích \S/ }).first().click();
    await expect(loginPhoneField(page)).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Đăng nhập để thích điểm này');
  });

  test('Sự kiện & Thử thách: không có tab Quà tặng, không có điểm thưởng', async ({ page }) => {
    await page.goto('/su-kien', { waitUntil: 'networkidle' });
    await expect(page.getByRole('tab', { name: 'Thử thách' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Sự kiện' })).toBeVisible();
    await expect(page.getByText(/Quà tặng|điểm vía thưởng|\+\d+ điểm/)).toHaveCount(0);
  });
});

test.describe('bảng tin & nội dung', () => {
  test('trang chủ: 4 bài ghim xếp đầu theo thiết kế, không có chữ AIBAT/Video', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const text = await page.locator('main').innerText();
    for (const name of ['Lan Anh', 'Tuấn Anh', 'Đặng Văn Nam', 'Thu Hương']) expect(text).toContain(name);
    expect(text.indexOf('Lan Anh')).toBeLessThan(text.indexOf('Lan Sale') === -1 ? Infinity : text.indexOf('Lan Sale'));
    expect(text).not.toContain('AIBAT');
    expect(text).not.toMatch(/\bVideo\b/);
  });

  test('Kể khổ: banner, thanh lọc, 4 bài đầu đúng thứ tự "Hot nhất"', async ({ page }) => {
    await page.goto('/bang-tin?type=story', { waitUntil: 'networkidle' });
    for (const f of ['Hot nhất', 'Mới nhất', 'Ảnh', 'Bình chọn']) await expect(page.getByRole('button', { name: new RegExp(f) }).first()).toBeVisible();
    await expect(shown(page, 'Chủ đề')).toBeVisible();
    const text = await page.locator('main').innerText();
    const order = ['Lan Sale', 'Quán Cà Phê Xinh', 'Mr. Đức', 'Nhà Hàng Sông Xanh'].map((n) => text.indexOf(n));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  test('lọc bài có ảnh chỉ còn bài có ảnh', async ({ page }) => {
    await page.goto('/bang-tin?type=story', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Ảnh', exact: true }).click();
    await expect(shown(page, /Khách xem 3 lần/)).toBeVisible();
    await expect(page.getByText('Tuần này gọi 80 khách')).toHaveCount(0);
  });
});
