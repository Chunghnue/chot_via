import type { FastifyReply } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Cookie phiên dùng chung giữa web public và admin (tên miền con) nhờ COOKIE_DOMAIN. */

const BASE_ENV = { DATABASE_URL: 'postgres://x:x@localhost:5432/x', JWT_ACCESS_SECRET: 'test-secret-test-secret-test-secret-1234', NODE_ENV: 'test' };

interface Written { name: string; value?: string; options: Record<string, unknown> }
function fakeReply(): { reply: FastifyReply; set: Written[]; cleared: Written[] } {
  const set: Written[] = [];
  const cleared: Written[] = [];
  const reply = {
    setCookie: (name: string, value: string, options: Record<string, unknown>) => { set.push({ name, value, options }); return reply; },
    clearCookie: (name: string, options: Record<string, unknown>) => { cleared.push({ name, options }); return reply; },
  } as unknown as FastifyReply;
  return { reply, set, cleared };
}

async function load(cookieDomain: string) {
  vi.resetModules();
  for (const [k, v] of Object.entries({ ...BASE_ENV, SMS_PROVIDER: 'dev', COOKIE_DOMAIN: cookieDomain })) vi.stubEnv(k, v);
  return import('../src/modules/auth/session-cookie');
}

afterEach(() => { vi.unstubAllEnvs(); });

describe('cookie phiên cv_rt', () => {
  it('không đặt COOKIE_DOMAIN: cookie chỉ thuộc host, không có Domain', async () => {
    const { setRefreshCookie, clearRefreshCookie } = await load('');
    const w = fakeReply();
    setRefreshCookie(w.reply, 'tok');
    expect(w.set[0]?.options).not.toHaveProperty('domain');
    clearRefreshCookie(w.reply);
    expect(w.cleared).toHaveLength(1);
    expect(w.cleared[0]?.options).not.toHaveProperty('domain');
  });

  it('có COOKIE_DOMAIN: đặt cookie với Domain chung (chấp nhận dấu chấm đầu và chữ hoa)', async () => {
    const { setRefreshCookie } = await load('.Chotvia.Example.com');
    const w = fakeReply();
    setRefreshCookie(w.reply, 'tok');
    expect(w.set[0]).toMatchObject({ name: 'cv_rt', value: 'tok', options: { domain: 'chotvia.example.com', httpOnly: true, path: '/api/v1/auth' } });
  });

  it('có COOKIE_DOMAIN: xóa cả cookie có Domain lẫn cookie cũ chỉ thuộc host', async () => {
    const { clearRefreshCookie } = await load('chotvia.example.com');
    const w = fakeReply();
    clearRefreshCookie(w.reply);
    expect(w.cleared.map((c) => c.options['domain'])).toEqual(['chotvia.example.com', undefined]);
    expect(w.cleared.every((c) => c.options['path'] === '/api/v1/auth')).toBe(true);
  });

  it('COOKIE_DOMAIN sai định dạng làm máy chủ không khởi động', async () => {
    await expect(load('khong hop le')).rejects.toThrow(/COOKIE_DOMAIN/);
    await expect(load('localhost')).rejects.toThrow(/COOKIE_DOMAIN/);
  });
});
