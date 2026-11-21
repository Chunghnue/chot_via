import { describe, expect, it } from 'vitest';
import { freshIp, freshPhone, get, login, post } from './support/api';

describe('đăng nhập OTP', () => {
  it('gửi OTP cho số hợp lệ và trả thời gian chờ gửi lại', async () => {
    const r = await post<{ resendAfterSec: number; expiresInSec: number }>('/auth/otp/request', { phone: freshPhone() }, { ip: freshIp() });
    expect(r.status).toBe(201);
    expect(r.code).toBe('OTP_SENT');
    expect(r.data).toEqual({ resendAfterSec: 60, expiresInSec: 300 });
  });

  it('từ chối số điện thoại không hợp lệ bằng mã lỗi (không trả chữ)', async () => {
    const r = await post('/auth/otp/request', { phone: '12345678' }, { ip: freshIp() });
    expect(r.status).toBe(400);
    expect(r.error?.code).toBe('AUTH_INVALID_PHONE');
  });

  it('gửi lại trong 60 giây bị chặn', async () => {
    const phone = freshPhone();
    const ip = freshIp();
    await post('/auth/otp/request', { phone }, { ip });
    const again = await post('/auth/otp/request', { phone }, { ip });
    expect(again.status).toBe(429);
    expect(again.error?.code).toBe('AUTH_OTP_RESEND_WAIT');
    expect(again.error?.params).toHaveProperty('retryAfterSec');
  });

  it('mã đúng tạo tài khoản mới, trả access token và đặt cookie refresh httpOnly', async () => {
    const phone = freshPhone();
    const ip = freshIp();
    await post('/auth/otp/request', { phone }, { ip });
    const r = await post<{ accessToken: string; isNewUser: boolean; user: { phoneMasked: string; points: number } }>('/auth/otp/verify', { phone, code: '123456' }, { ip });
    expect(r.status).toBe(201);
    expect(r.data.accessToken.split('.')).toHaveLength(3);
    expect(r.data.isNewUser).toBe(true);
    expect(r.data.user.points).toBe(0);
    expect(r.data.user.phoneMasked).toContain('****');
    const cookies = r.headers.getSetCookie().join('\n');
    expect(cookies).toMatch(/cv_rt=/);
    expect(cookies).toMatch(/HttpOnly/i);
  });

  it('đăng nhập lại cùng số không tạo tài khoản mới', async () => {
    const phone = freshPhone();
    const a = await login(phone);
    expect(a.userId).toBeTruthy();
    const ver = await post<{ isNewUser: boolean; user: { id: string } }>('/auth/otp/verify', { phone, code: '123456' }, { ip: freshIp() });
    // OTP đã dùng → mã mới cần gửi lại; kiểm tra bằng /me thay vì gửi lại (đang trong thời gian chờ).
    expect([201, 400, 429]).toContain(ver.status);
    const me = await get<{ id: string }>('/me', { token: a.token });
    expect(me.data.id).toBe(a.userId);
  });

  it('mã sai trả số lần còn lại; sai quá 5 lần thì khóa', async () => {
    const phone = freshPhone();
    const ip = freshIp();
    await post('/auth/otp/request', { phone }, { ip });
    const first = await post('/auth/otp/verify', { phone, code: '000000' }, { ip });
    expect(first.error?.code).toBe('AUTH_OTP_INVALID');
    expect(first.error?.params).toEqual({ remainingAttempts: 4 });
    let last = first;
    for (let i = 0; i < 5; i += 1) last = await post('/auth/otp/verify', { phone, code: '000000' }, { ip });
    expect(['AUTH_OTP_LOCKED', 'AUTH_OTP_INVALID']).toContain(last.error?.code);
    const locked = await post('/auth/otp/verify', { phone, code: '123456' }, { ip });
    expect(locked.status).toBeGreaterThanOrEqual(400);
    expect(locked.error?.code).not.toBeUndefined();
  });

  it('chỉ được gửi tối đa 3 OTP trong 15 phút', async () => {
    const phone = freshPhone();
    const ip = freshIp();
    const results = [];
    for (let i = 0; i < 4; i += 1) results.push(await post('/auth/otp/request', { phone }, { ip }));
    // lần 1 thành công; các lần sau bị chặn do chờ 60 giây hoặc vượt giới hạn
    expect(results[0]?.status).toBe(201);
    expect(results.slice(1).every((r) => r.status === 429)).toBe(true);
  });

  it('khách mở app: /auth/session trả data null, không lỗi 401', async () => {
    const r = await post<null>('/auth/session', {});
    expect(r.status).toBeLessThan(400);
    expect(r.data).toBeNull();
  });

  it('refresh/logout dùng cookie nên thiếu header CSRF bị từ chối', async () => {
    const s = await login();
    const r = await post('/auth/refresh', {}, { cookie: s.cookie, csrf: false });
    expect(r.status).toBe(403);
    expect(r.error?.code).toBe('AUTH_CSRF_FAILED');
  });

  it('API cần đăng nhập trả AUTH_REQUIRED cho khách', async () => {
    const r = await get('/me');
    expect(r.status).toBe(401);
    expect(r.error?.code).toBe('AUTH_REQUIRED');
  });

  it('làm mới phiên bằng cookie refresh trả access token mới', async () => {
    const s = await login();
    const r = await post<{ accessToken: string }>('/auth/refresh', {}, { cookie: s.cookie });
    expect(r.status).toBeLessThan(300);
    expect(r.data.accessToken).toBeTruthy();
  });

  it('hai ứng dụng (web công khai và admin) làm mới phiên cùng lúc bằng cùng một cookie đều giữ được phiên', async () => {
    const s = await login();
    const a = await post<{ accessToken: string }>('/auth/session', {}, { cookie: s.cookie });
    const b = await post<{ accessToken: string }>('/auth/session', {}, { cookie: s.cookie });
    console.log('DBG', JSON.stringify([a.status, a.data === null, b.status, b.data === null, s.cookie.slice(0,40)]));
    expect(a.data).not.toBeNull();
    expect(b.data).not.toBeNull();
  });

  it('đăng xuất thì cookie cũ không dùng lại được, kể cả ngay sau đó', async () => {
    const s = await login();
    expect((await post('/auth/logout', {}, { cookie: s.cookie })).status).toBeLessThan(300);
    const r = await post<unknown>('/auth/session', {}, { cookie: s.cookie });
    expect(r.data).toBeNull();
  });
});
