import { resolve } from 'node:path';
import { defineProject } from 'vitest/config';

export default defineProject({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: { alias: { '@': resolve(import.meta.dirname, 'src') } },
  test: { name: 'web-public', include: ['test/**/*.test.{ts,tsx}'], environment: 'jsdom', css: false },
});
