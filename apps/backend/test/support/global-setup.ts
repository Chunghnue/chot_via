import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postgres from 'postgres';

export const API_PORT = 3101;
const ADMIN_URL = 'postgres://chotvia:chotvia@localhost:5432/postgres';
const TEST_DB = 'chotvia_test';
const root = resolve(import.meta.dirname, '../..');

function secret(): string {
  const env = readFileSync(resolve(root, '../../.env'), 'utf8');
  return /^JWT_ACCESS_SECRET=(.+)$/m.exec(env)?.[1]?.trim() ?? 'test-secret-test-secret-test-secret-1234';
}

const testEnv = (): NodeJS.ProcessEnv => ({
  ...process.env, NODE_ENV: 'development', PORT: String(API_PORT), DATABASE_URL: `postgres://chotvia:chotvia@localhost:5432/${TEST_DB}`,
  REDIS_URL: '', JWT_ACCESS_SECRET: secret(), SMS_PROVIDER: 'dev', DEV_FIXED_OTP: '123456', STORAGE_LOCAL_DIR: './storage-test', SEED_ADMIN_PHONE: '0900000000',
  PUBLIC_WEB_URL: 'http://localhost:3100', PUBLIC_API_URL: 'http://localhost:3100',
});

function run(args: string): void {
  const r = spawnSync(`npx tsx ${args}`, { cwd: root, env: testEnv(), shell: true, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`Lỗi chạy "${args}":\n${r.stdout}\n${r.stderr}`);
}

let server: ChildProcess | null = null;

/** Tạo lại database test sạch → migration → seed (danh mục + dữ liệu mẫu) → bật API thật ở cổng riêng. Không đụng dữ liệu dev. */
const isWindows = process.platform === 'win32';

/** Tắt server test còn sót từ lần chạy trước (nếu không, bộ test sẽ dùng lại bản cũ và bỏ qua mã mới). */
function freePort(): void {
  if (isWindows) return;
  const pids = spawnSync(`lsof -ti tcp:${API_PORT} -sTCP:LISTEN`, { shell: true, encoding: 'utf8' }).stdout.split('\n').map((x) => x.trim()).filter(Boolean);
  for (const pid of pids) spawnSync(`kill -9 ${pid}`, { shell: true, stdio: 'ignore' });
}

export async function setup(): Promise<void> {
  freePort();
  const admin = postgres(ADMIN_URL, { max: 1 });
  await admin.unsafe(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await admin.unsafe(`CREATE DATABASE ${TEST_DB} ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C' TEMPLATE template0`);
  await admin.end();
  run('src/database/migrate.ts');
  run('src/database/seed.ts');
  run('src/database/seed-demo-content.ts');
  run('src/database/seed-home.ts');
  server = spawn('npx tsx src/main.ts', { cwd: root, env: testEnv(), shell: true, stdio: 'ignore', windowsHide: true, detached: !isWindows });
  const deadline = Date.now() + 120_000;
  for (;;) {
    try {
      const res = await fetch(`http://localhost:${API_PORT}/api/v1/catalog`);
      if (res.ok) return;
    } catch { /* chưa lên */ }
    if (Date.now() > deadline) throw new Error('API test không khởi động được trong 120 giây');
    await new Promise((r) => setTimeout(r, 1000));
  }
}

export async function teardown(): Promise<void> {
  if (server?.pid) {
    if (isWindows) spawnSync(`taskkill /pid ${server.pid} /T /F`, { shell: true, stdio: 'ignore' });
    else { try { process.kill(-server.pid, 'SIGKILL'); } catch { /* đã tắt */ } freePort(); }
  }
  server = null;
}
