import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

/** PostgreSQL nhúng cho máy dev không có Docker. Dữ liệu lưu ở <repo>/.embedded-pg. */
const databaseDir = resolve(process.cwd(), '../../.embedded-pg');
const pg = new EmbeddedPostgres({ databaseDir, user: 'chotvia', password: 'chotvia', port: 5432, persistent: true, initdbFlags: ['--encoding=UTF8', '--locale=C'] });

if (!existsSync(resolve(databaseDir, 'PG_VERSION'))) await pg.initialise();
await pg.start();
try {
  await pg.createDatabase('chotvia');
} catch {
  // Database đã tồn tại.
}
console.log('PostgreSQL nhúng đang chạy tại postgres://chotvia:chotvia@localhost:5432/chotvia (Ctrl+C để dừng)');

const stop = async (): Promise<void> => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());
setInterval(() => undefined, 1 << 30);
