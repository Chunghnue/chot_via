import { homedir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';

/** E2E trình duyệt thật: backend + database test (cổng 3101), web (3100), admin (5273). Chạy: `pnpm test:e2e`. */
const chromium = join(process.env['LOCALAPPDATA'] ?? homedir(), 'ms-playwright', 'chromium-1254', 'chrome-win64', 'chrome.exe');
const launchOptions = { executablePath: process.env['PW_CHROMIUM'] ?? chromium };
const backend = 'http://localhost:3101';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3100', launchOptions, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    {
      command: 'pnpm --filter @xin-via/web-public exec next dev -p 3100',
      url: 'http://localhost:3100/',
      timeout: 240_000,
      reuseExistingServer: false,
      env: { BACKEND_URL: backend, NEXT_DIST_DIR: '.next-e2e' },
    },
    {
      command: 'pnpm --filter @xin-via/web-admin exec vite --port 5273 --strictPort',
      url: 'http://localhost:5273/',
      timeout: 120_000,
      reuseExistingServer: false,
      env: { BACKEND_URL: backend },
    },
  ],
  projects: [
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    { name: 'ipad-portrait', use: { viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: 'ipad-landscape', use: { viewport: { width: 1180, height: 820 }, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
});
