import { homedir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';

/** Kiểm trên BẢN PRODUCTION (next build + next start): PWA, service worker, chạy offline. Chạy: `pnpm test:e2e:prod`. */
const chromium = join(process.env['LOCALAPPDATA'] ?? homedir(), 'ms-playwright', 'chromium-1254', 'chrome-win64', 'chrome.exe');

export default defineConfig({
  testDir: './e2e-prod',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3300', launchOptions: { executablePath: process.env['PW_CHROMIUM'] ?? chromium }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: 'pnpm --filter @xin-via/web-public exec next build && pnpm --filter @xin-via/web-public exec next start -p 3300',
    url: 'http://localhost:3300/', timeout: 600_000, reuseExistingServer: false,
    env: { BACKEND_URL: 'http://localhost:3101', NEXT_DIST_DIR: '.next-prod', NEXT_TELEMETRY_DISABLED: '1' },
  },
  projects: [{ name: 'mobile', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } }],
});
