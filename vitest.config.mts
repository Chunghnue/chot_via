import { defineConfig } from 'vitest/config';

/** Chạy toàn bộ test một lượt: `pnpm test` (shared + backend + web-public). E2E trình duyệt: `pnpm test:e2e`. */
export default defineConfig({
  test: { projects: ['packages/shared', 'apps/backend', 'apps/web-public'] },
});
