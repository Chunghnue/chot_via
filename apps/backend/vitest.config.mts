import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'backend', include: ['test/**/*.test.ts'], environment: 'node', globalSetup: ['./test/support/global-setup.ts'],
    testTimeout: 30_000, hookTimeout: 180_000, fileParallelism: false,
  },
});
