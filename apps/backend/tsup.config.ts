import { defineConfig } from 'tsup';

export default defineConfig({
  /** main = API; migrate/seed/seed-home/seed-baseline = lệnh một lần khi triển khai (tạo bảng, nạp danh mục khởi tạo và dữ liệu trang chủ, đưa về bản trắng; chạy lại an toàn). */
  entry: {
    main: 'src/main.ts',
    migrate: 'src/database/migrate.ts',
    seed: 'src/database/seed.ts',
    'seed-home': 'src/database/seed-home.ts',
    'seed-baseline': 'src/database/seed-baseline.ts',
    'seed-sample': 'src/database/seed-sample.ts',
    'seed-demo-content': 'src/database/seed-demo-content.ts',
  },
  format: ['esm'],
  target: 'node24',
  platform: 'node',
  clean: true,
  sourcemap: true,
  noExternal: [/^@chot-via\//],
  tsconfig: 'tsconfig.json',
});
