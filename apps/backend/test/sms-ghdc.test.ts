import { Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Test đơn vị cho GhdcSmsProvider và chọn provider SMS: giả lập fetch, không gọi dịch vụ thật. */

const CONFIG = { baseUrl: 'https://sms.ghdc.vn/api', email: 'test@example.com', password: 'mat-khau-bi-mat-123', cpId: '118', tempId: '34' };
const TOKEN = 'token-bi-mat-abcdef';
const PHONE = '0912345678';
const CODE = '654321';
const BASE_ENV = { DATABASE_URL: 'postgres://x:x@localhost:5432/x', JWT_ACCESS_SECRET: 'test-secret-test-secret-test-secret-1234', NODE_ENV: 'test' };

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

interface Call { url: string; init: RequestInit }
function stubFetch(handler: (call: Call) => Response | Promise<Response>): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => { const call = { url, init }; calls.push(call); return handler(call); }));
  return calls;
}
const okHandler = (call: Call): Response => (call.url.endsWith('/auth/login') ? json({ token: TOKEN }) : json({ status: 'ok' }));
const bodyOf = (call: Call | undefined): Record<string, unknown> => JSON.parse(String(call?.init.body)) as Record<string, unknown>;

async function loadSms(extra: Record<string, string> = {}) {
  vi.resetModules();
  for (const key of ['GHDC_SMS_BASE_URL', 'GHDC_SMS_EMAIL', 'GHDC_SMS_PASSWORD', 'GHDC_SMS_CP_ID', 'GHDC_SMS_TEMP_ID', 'SPEEDSMS_ACCESS_TOKEN', 'ESMS_API_KEY', 'ESMS_SECRET_KEY']) vi.stubEnv(key, '');
  for (const [k, v] of Object.entries({ SMS_PROVIDER: 'dev', ...BASE_ENV, ...extra })) vi.stubEnv(k, v);
  return import('../src/modules/auth/sms');
}

const logged: unknown[][] = [];
beforeEach(() => {
  logged.length = 0;
  for (const method of ['log', 'warn', 'error', 'debug', 'verbose'] as const) vi.spyOn(Logger.prototype, method).mockImplementation((...args: unknown[]) => { logged.push(args); });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('GhdcSmsProvider', () => {
  it('đăng nhập rồi gửi đúng endpoint, phương thức, header và dữ liệu như hệ thống cũ', async () => {
    const { GhdcSmsProvider } = await loadSms();
    const calls = stubFetch(okHandler);
    await expect(new GhdcSmsProvider(CONFIG).send(PHONE, CODE)).resolves.toBeUndefined();
    expect(calls).toHaveLength(2);
    const [login, send] = calls;
    expect(login?.url).toBe('https://sms.ghdc.vn/api/auth/login');
    expect(login?.init.method).toBe('POST');
    expect(login?.init.headers).toMatchObject({ 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    expect(bodyOf(login)).toEqual({ email: CONFIG.email, password: CONFIG.password });
    expect(send?.url).toBe('https://sms.ghdc.vn/api/sendSMS');
    expect(send?.init.method).toBe('POST');
    expect(send?.init.headers).toMatchObject({ 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    expect(bodyOf(send)).toEqual({ temp_id: '34', cp_id: '118', isdn: PHONE, content: `${CODE} la ma xac minh Aibat cua ban.`, token: TOKEN });
    expect(send?.init.signal).toBeInstanceOf(AbortSignal);
  });

  it('nội dung đúng mẫu, dùng đúng mã OTP được truyền vào, không tự thêm sửa', async () => {
    const { ghdcContent } = await loadSms();
    expect(ghdcContent('123456')).toBe('123456 la ma xac minh Aibat cua ban.');
    expect(ghdcContent('000042')).toBe('000042 la ma xac minh Aibat cua ban.');
  });

  it('bỏ dấu gạch chéo thừa cuối địa chỉ gốc', async () => {
    const { GhdcSmsProvider } = await loadSms();
    const calls = stubFetch(okHandler);
    await new GhdcSmsProvider({ ...CONFIG, baseUrl: 'https://sms.ghdc.vn/api//' }).send(PHONE, CODE);
    expect(calls.map((c) => c.url)).toEqual(['https://sms.ghdc.vn/api/auth/login', 'https://sms.ghdc.vn/api/sendSMS']);
  });

  const fails: [string, (call: Call) => Response | Promise<Response>, number][] = [
    ['đăng nhập trả HTTP 401', (c) => (c.url.endsWith('/auth/login') ? json({ message: 'sai' }, 401) : json({})), 1],
    ['đăng nhập không có token', (c) => (c.url.endsWith('/auth/login') ? json({ message: 'ok' }) : json({})), 1],
    ['đăng nhập có token rỗng', (c) => (c.url.endsWith('/auth/login') ? json({ token: '   ' }) : json({})), 1],
    ['đăng nhập trả dữ liệu không phải JSON', (c) => (c.url.endsWith('/auth/login') ? new Response('<html>loi</html>', { status: 200 }) : json({})), 1],
    ['gửi tin trả HTTP 500', (c) => (c.url.endsWith('/auth/login') ? json({ token: TOKEN }) : json({ error: 'x' }, 500)), 2],
    ['gửi tin trả HTTP 400', (c) => (c.url.endsWith('/auth/login') ? json({ token: TOKEN }) : json({ error: 'x' }, 400)), 2],
    ['gửi tin trả dữ liệu không phải JSON', (c) => (c.url.endsWith('/auth/login') ? json({ token: TOKEN }) : new Response('OK', { status: 200 })), 2],
  ];
  it.each(fails)('%s thì coi là thất bại (AUTH_OTP_SEND_FAILED)', async (_name, handler, expectedCalls) => {
    const { GhdcSmsProvider } = await loadSms();
    const calls = stubFetch(handler);
    await expect(new GhdcSmsProvider(CONFIG).send(PHONE, CODE)).rejects.toMatchObject({ code: 'AUTH_OTP_SEND_FAILED', status: 502 });
    expect(calls).toHaveLength(expectedCalls);
  });

  it('lỗi mạng ở bước đăng nhập hoặc bước gửi đều là thất bại', async () => {
    const { GhdcSmsProvider } = await loadSms();
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('fetch failed'))));
    await expect(new GhdcSmsProvider(CONFIG).send(PHONE, CODE)).rejects.toMatchObject({ code: 'AUTH_OTP_SEND_FAILED' });
    stubFetch((c) => { if (c.url.endsWith('/auth/login')) return json({ token: TOKEN }); throw new TypeError('fetch failed'); });
    await expect(new GhdcSmsProvider(CONFIG).send(PHONE, CODE)).rejects.toMatchObject({ code: 'AUTH_OTP_SEND_FAILED' });
  });

  it('quá thời gian chờ là thất bại', async () => {
    const { GhdcSmsProvider } = await loadSms();
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new DOMException('The operation timed out.', 'TimeoutError'))));
    await expect(new GhdcSmsProvider(CONFIG).send(PHONE, CODE)).rejects.toMatchObject({ code: 'AUTH_OTP_SEND_FAILED' });
  });

  it('không ghi mật khẩu, token, OTP hay số điện thoại vào log, kể cả khi lỗi', async () => {
    const { GhdcSmsProvider } = await loadSms();
    stubFetch(okHandler);
    await new GhdcSmsProvider(CONFIG).send(PHONE, CODE);
    stubFetch((c) => (c.url.endsWith('/auth/login') ? json({ token: TOKEN }) : json({ error: `loi ${CODE} ${TOKEN} ${PHONE}` }, 500)));
    await expect(new GhdcSmsProvider(CONFIG).send(PHONE, CODE)).rejects.toBeDefined();
    stubFetch(() => json({ message: CONFIG.password }, 401));
    await expect(new GhdcSmsProvider(CONFIG).send(PHONE, CODE)).rejects.toBeDefined();
    expect(logged.length).toBeGreaterThan(0);
    const text = JSON.stringify(logged);
    for (const secret of [CONFIG.password, TOKEN, CODE, PHONE, CONFIG.email]) expect(text).not.toContain(secret);
  });
});

describe('chọn provider SMS và kiểm tra cấu hình', () => {
  it('SMS_PROVIDER=ghdc dùng GHDC (đăng nhập tới đúng địa chỉ cấu hình)', async () => {
    const { createSmsProvider } = await loadSms({ SMS_PROVIDER: 'ghdc', GHDC_SMS_EMAIL: CONFIG.email, GHDC_SMS_PASSWORD: CONFIG.password, GHDC_SMS_CP_ID: '118', GHDC_SMS_TEMP_ID: '34' });
    const calls = stubFetch(okHandler);
    await createSmsProvider().send(PHONE, CODE);
    expect(calls[0]?.url).toBe('https://sms.ghdc.vn/api/auth/login');
    expect(bodyOf(calls[1])).toMatchObject({ temp_id: '34', cp_id: '118', isdn: PHONE });
  });

  it('dev không gọi mạng; speedsms và esms vẫn gọi đúng nhà cung cấp, nội dung cũ không đổi', async () => {
    let sms = await loadSms();
    let calls = stubFetch(() => json({}));
    await sms.createSmsProvider().send(PHONE, CODE);
    expect(calls).toHaveLength(0);

    sms = await loadSms({ SMS_PROVIDER: 'speedsms', SPEEDSMS_ACCESS_TOKEN: 'abc' });
    calls = stubFetch(() => json({ status: 'success' }));
    await sms.createSmsProvider().send(PHONE, CODE);
    expect(calls[0]?.url).toBe('https://api.speedsms.vn/index.php/sms/send');
    expect(String(bodyOf(calls[0]).content)).toBe(`Ma xac thuc Chot Via cua ban la ${CODE}. Ma co hieu luc 5 phut, khong chia se cho bat ky ai.`);

    sms = await loadSms({ SMS_PROVIDER: 'esms', ESMS_API_KEY: 'k', ESMS_SECRET_KEY: 's' });
    calls = stubFetch(() => json({ CodeResult: '100' }));
    await sms.createSmsProvider().send(PHONE, CODE);
    expect(calls[0]?.url).toBe('https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/');
  });

  it('SMS_PROVIDER=ghdc thiếu cấu hình bắt buộc hoặc URL sai thì không khởi động được; provider khác không đòi GHDC', async () => {
    const full = { SMS_PROVIDER: 'ghdc', GHDC_SMS_EMAIL: CONFIG.email, GHDC_SMS_PASSWORD: CONFIG.password, GHDC_SMS_CP_ID: '118', GHDC_SMS_TEMP_ID: '34' };
    await expect(loadSms(full)).resolves.toBeDefined();
    for (const missing of ['GHDC_SMS_EMAIL', 'GHDC_SMS_PASSWORD', 'GHDC_SMS_CP_ID', 'GHDC_SMS_TEMP_ID']) {
      await expect(loadSms({ ...full, [missing]: '' })).rejects.toThrow(new RegExp(missing));
    }
    await expect(loadSms({ ...full, GHDC_SMS_BASE_URL: 'khong-phai-url' })).rejects.toThrow(/GHDC_SMS_BASE_URL/);
    await expect(loadSms({ SMS_PROVIDER: 'dev' })).resolves.toBeDefined();
    await expect(loadSms({ SMS_PROVIDER: 'speedsms' })).resolves.toBeDefined();
  });

  it('thông báo lỗi cấu hình không chứa giá trị mật khẩu', async () => {
    const error = await loadSms({ SMS_PROVIDER: 'ghdc', GHDC_SMS_PASSWORD: CONFIG.password }).catch((e: unknown) => e);
    expect(String(error)).not.toContain(CONFIG.password);
  });
});
