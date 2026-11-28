import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SignJWT } from 'jose';
import postgres from 'postgres';
import { API_PORT } from './global-setup';

export const BASE = `http://localhost:${API_PORT}/api/v1`;
export interface ApiResult<T = unknown> { status: number; code: string; data: T; meta: unknown; error: { code: string; params?: Record<string, unknown>; details?: unknown } | null; headers: Headers }
type Json = Record<string, unknown> | unknown[] | null;

/** Gọi API thật (kèm header CSRF). `token` = access token Bearer; `ip` giả lập khách khác nhau để tránh dùng chung giới hạn tốc độ. */
export async function call<T = unknown>(method: string, path: string, opts: { token?: string; body?: Json; ip?: string; cookie?: string; csrf?: boolean } = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = opts.body !== undefined ? { 'content-type': 'application/json' } : {};
  if (opts.csrf !== false) headers['x-requested-with'] = 'xinvia';
  if (opts.token) headers['authorization'] = `Bearer ${opts.token}`;
  if (opts.ip) headers['x-forwarded-for'] = opts.ip;
  if (opts.cookie) headers['cookie'] = opts.cookie;
  const res = await fetch(`${BASE}${path}`, { method, headers, ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}) });
  const text = await res.text();
  const json = text ? (JSON.parse(text) as { code?: string; data?: T; meta?: unknown; error?: ApiResult['error'] }) : {};
  return { status: res.status, code: json.code ?? json.error?.code ?? '', data: json.data as T, meta: json.meta, error: json.error ?? null, headers: res.headers };
}
export const get = <T = unknown>(path: string, o?: Parameters<typeof call>[2]) => call<T>('GET', path, o);
export const post = <T = unknown>(path: string, body: Json, o?: Parameters<typeof call>[2]) => call<T>('POST', path, { ...o, body });
export const put = <T = unknown>(path: string, body: Json, o?: Parameters<typeof call>[2]) => call<T>('PUT', path, { ...o, body });
export const patch = <T = unknown>(path: string, body: Json, o?: Parameters<typeof call>[2]) => call<T>('PATCH', path, { ...o, body });
export const del = <T = unknown>(path: string, o?: Parameters<typeof call>[2]) => call<T>('DELETE', path, o);

let phoneCounter = Math.floor(Math.random() * 90_000) + 10_000;
let ipCounter = Math.floor(Math.random() * 200) + 20;
/** Địa chỉ IP giả khác nhau cho mỗi lần gọi để không dùng chung giới hạn OTP theo IP. */
export const freshIp = (): string => `10.${Math.floor(ipCounter / 250) % 250}.${ipCounter++ % 250}.${Math.floor(Math.random() * 250) + 1}`;
export const freshPhone = (): string => `09${String(phoneCounter++).padStart(8, '0')}`;

export interface Session { token: string; phone: string; userId: string; cookie: string }
/** Đăng nhập OTP (mã dev cố định 123456) bằng số điện thoại mới. */
export async function login(phone: string = freshPhone()): Promise<Session> {
  const ip = freshIp();
  const req = await post('/auth/otp/request', { phone }, { ip });
  if (req.status !== 201 && req.status !== 200) throw new Error(`otp/request ${req.status} ${req.code}`);
  const ver = await post<{ accessToken: string; user: { id: string } }>('/auth/otp/verify', { phone, code: '123456' }, { ip });
  if (!ver.data?.accessToken) throw new Error(`otp/verify ${ver.status} ${ver.code}`);
  const cookie = (ver.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  return { token: ver.data.accessToken, phone, userId: ver.data.user.id, cookie };
}
/** Admin: tạo token trực tiếp (OTP của số admin bị giới hạn 3 lần/15 phút nên không đăng nhập OTP lặp lại trong test). */
let adminCache: Session | null = null;
export async function adminLogin(): Promise<Session> {
  if (adminCache) return adminCache;
  const sql = postgres('postgres://xinvia:xinvia@localhost:5432/xinvia_test', { max: 1 });
  const rows = await sql<{ id: string }[]>`select id from users where account_role = 'admin' limit 1`;
  await sql.end();
  const id = rows[0]?.id;
  if (!id) throw new Error('không có tài khoản admin trong database test');
  const env = readFileSync(resolve(import.meta.dirname, '../../../../.env'), 'utf8');
  const secret = /^JWT_ACCESS_SECRET=(.+)$/m.exec(env)?.[1]?.trim() ?? '';
  const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(id).setIssuedAt().setExpirationTime('30m').sign(new TextEncoder().encode(secret));
  adminCache = { token, phone: '0368886999', userId: id, cookie: '' };
  return adminCache;
}

export interface IdName { id: string; name: string; code?: string }
export interface CatalogShape { wishTypes: IdName[]; categories: { id: string; kind: string; code: string }[]; sceneTemplates: { id: string; kind: string }[]; stickers: IdName[] }
let catalogCache: CatalogShape | null = null;
export async function catalog(): Promise<CatalogShape> {
  if (catalogCache) return catalogCache;
  const r = await get<CatalogShape>('/catalog');
  catalogCache = r.data;
  return r.data;
}
