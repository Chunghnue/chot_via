import postgres from 'postgres';

/** Xóa toàn bộ dữ liệu dev (schema public + drizzle). Chỉ dùng cho môi trường phát triển. */
const url = process.env['DATABASE_URL'];
if (!url || process.env['NODE_ENV'] === 'production') throw new Error('Không chạy được ở production hoặc thiếu DATABASE_URL');
const sql = postgres(url, { onnotice: () => undefined });
await sql`drop schema if exists public cascade`;
await sql`drop schema if exists drizzle cascade`;
await sql`create schema public`;
await sql.end();
console.log('Đã xóa sạch database dev.');
