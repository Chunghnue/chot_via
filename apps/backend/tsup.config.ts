import { defineConfig } from 'tsup';

export default defineConfig({
  /** main = API; migrate/seed = lệnh một lần khi triển khai (tạo bảng, nạp danh mục khởi tạo; seed bỏ qua nếu đã có dữ liệu). */
  entry: { main: 'src/main.ts', migrate: 'src/database/migrate.ts', seed: 'src/database/seed.ts' },
  format: ['esm'],
  target: 'node24',
  platform: 'node',
  clean: true,
  sourcemap: true,
  noExternal: [/^@chot-via\//],
  tsconfig: 'tsconfig.json',
});
