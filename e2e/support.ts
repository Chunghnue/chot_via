import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const VIEWPORT_PAGES: [string, string][] = [
  ['Trang chủ', '/'], ['Kể khổ', '/bang-tin?type=story'], ['Bảng tin', '/bang-tin'], ['Phố 3D', '/pho-3d'], ['Cửa hàng', '/diem/quan-cafe-an-nhien'],
  ['Bảng xếp hạng', '/bang-xep-hang'], ['Sự kiện', '/su-kien'], ['Tạo cửa hàng', '/tao-diem'],
];

/** Phần tử có chữ này và đang hiển thị (bỏ qua bản lặp bị ẩn theo kích thước màn hình). */
export const shown = (page: Page, text: string | RegExp) => page.getByText(text).locator('visible=true').first();

/** Hộp đăng nhập hiện ra (ô nhập số điện thoại). */
export const loginPhoneField = (page: Page) => page.getByPlaceholder('Nhập số điện thoại của bạn');

/** Không có cuộn ngang ở bất kỳ kích thước nào. */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(scrollWidth, `scrollWidth ${scrollWidth} > ${clientWidth}`).toBeLessThanOrEqual(clientWidth + 1);
}

let phoneSeq = Math.floor(Math.random() * 90_000) + 10_000;
export const newPhone = (): string => `09${String(phoneSeq++).padStart(8, '0')}`;

/** Đăng nhập qua giao diện: nhập số, gửi OTP, nhập mã dev cố định. */
export async function loginViaUi(page: Page, phone: string = newPhone()): Promise<void> {
  // Backend giới hạn 10 lần gửi OTP mỗi giờ cho mỗi IP; mỗi lần đăng nhập giả lập một IP khác để cả bộ E2E không chạm trần.
  const ip = headers()['x-forwarded-for'] ?? '10.77.1.1';
  await page.route('**/api/v1/auth/otp/**', (route) => route.continue({ headers: { ...route.request().headers(), 'x-forwarded-for': ip } }));
  await page.getByPlaceholder('Nhập số điện thoại của bạn').fill(phone);
  await page.getByRole('button', { name: 'Gửi mã OTP' }).click();
  await page.getByPlaceholder('Mã 6 số').fill('123456');
  await page.getByRole('button', { name: 'Xác nhận' }).click();
}

export const API = 'http://localhost:3101/api/v1';
let ipSeq = Math.floor(Math.random() * 200) + 20;
export const headers = (): Record<string, string> => ({
  'x-requested-with': 'chotvia',
  'content-type': 'application/json',
  'x-forwarded-for': `10.77.${ipSeq++ % 250}.${Math.floor(Math.random() * 250) + 1}`,
});

/** Đăng nhập OTP thẳng vào API test; cookie phiên được lưu vào chính `request` (dùng chung với trình duyệt nếu là `page.context().request`). */
export async function apiLogin(request: APIRequestContext): Promise<{ token: string; userId: string }> {
  const phone = newPhone();
  const h = headers();
  expect((await request.post(`${API}/auth/otp/request`, { headers: h, data: { phone } })).status()).toBe(201);
  const ver = await request.post(`${API}/auth/otp/verify`, { headers: h, data: { phone, code: '123456' } });
  expect(ver.status()).toBe(201);
  const body = (await ver.json()) as { data: { accessToken: string; user: { id: string } } };
  return { token: body.data.accessToken, userId: body.data.user.id };
}

