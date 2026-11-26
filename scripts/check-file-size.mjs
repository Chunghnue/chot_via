#!/usr/bin/env node
/**
 * Kiểm tra quy tắc "mỗi file mã nguồn tối đa 300 dòng" (CLAUDE.md, quy tắc 11).
 * - Tính theo tổng số dòng của file (kể cả dòng trống và chú thích); áp dụng cho .ts, .tsx, .css.
 * - Bỏ qua: file khai báo kiểu (.d.ts), thư mục drizzle/ (migration sinh tự động), node_modules, dữ liệu chữ i18n (.json).
 * - File cũ đã vượt trước khi có quy tắc nằm trong scripts/file-size-allowlist.json với trần hiện tại: không được dài thêm; khi tách xuống dưới 300 dòng thì phải xóa khỏi danh sách.
 * Thoát với mã 1 nếu có vi phạm (dùng trong `pnpm typecheck` và hook pre-commit).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LIMIT = 300;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const allowlist = JSON.parse(readFileSync(resolve(root, 'scripts/file-size-allowlist.json'), 'utf8')).files;

const tracked = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean);
const isChecked = (f) => /\.(ts|tsx|css)$/.test(f) && !f.endsWith('.d.ts') && !f.includes('/drizzle/') && !f.includes('node_modules/');
const countLines = (f) => { const t = readFileSync(resolve(root, f), 'utf8'); return t === '' ? 0 : t.split('\n').length - (t.endsWith('\n') ? 1 : 0); };

const errors = [];
const seen = new Set();
for (const f of tracked.filter(isChecked)) {
  seen.add(f);
  const n = countLines(f);
  const ceiling = allowlist[f];
  if (ceiling === undefined) {
    if (n > LIMIT) errors.push(`${f}: ${n} dòng, vượt giới hạn ${LIMIT} dòng. Hãy tách file (thành phần, hook, hàm tiện ích hoặc dịch vụ riêng).`);
  } else if (n > ceiling) {
    errors.push(`${f}: ${n} dòng, dài hơn trần ${ceiling} của file cũ đã vượt giới hạn. Không được làm dài thêm; hãy tách bớt.`);
  } else if (n <= LIMIT) {
    errors.push(`${f}: nay chỉ còn ${n} dòng, hãy xóa khỏi scripts/file-size-allowlist.json.`);
  }
}
for (const f of Object.keys(allowlist)) if (!seen.has(f)) errors.push(`${f}: có trong scripts/file-size-allowlist.json nhưng file không còn, hãy xóa dòng này.`);

if (errors.length > 0) {
  console.error(`Kiểm tra giới hạn ${LIMIT} dòng mỗi file: ${errors.length} lỗi\n` + errors.map((e) => `  ✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`Kiểm tra giới hạn ${LIMIT} dòng mỗi file: đạt (${seen.size} file).`);
