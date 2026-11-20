import { join } from 'node:path';
import type { NextConfig } from 'next';

const backend = process.env['BACKEND_URL'] ?? 'http://localhost:3001';

const standalone = process.env['NEXT_OUTPUT'] === 'standalone';

const config: NextConfig = {
  /** Bản Docker: gói gọn để chạy bằng `node server.js` (đặt NEXT_OUTPUT=standalone khi build). */
  ...(standalone ? { output: 'standalone' as const, outputFileTracingRoot: join(process.cwd(), '../..') } : {}),
  /** Cho phép chạy bản dev thứ hai (E2E) song song mà không tranh thư mục .next. */
  distDir: process.env['NEXT_DIST_DIR'] ?? '.next',
  /** R3F (Phố 3D) in cảnh báo giả khi StrictMode double-mount ở dev; production không bị. */
  reactStrictMode: false,
  /** Cho phép mở bản dev từ máy ảo Android (10.0.2.2 là máy tính chủ) và từ máy khác trong mạng LAN. */
  allowedDevOrigins: ['10.0.2.2', '192.168.*.*', '10.*.*.*'],
  transpilePackages: ['@chot-via/shared', '@chot-via/ui', '@chot-via/api-client', '@chot-via/scene-3d'],
  /** Web và API cùng nguồn gốc (same-origin) → cookie phiên httpOnly hoạt động, không cần CORS. */
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backend}/api/:path*` },
      { source: '/storage/:path*', destination: `${backend}/storage/:path*` },
    ];
  },
  async headers() {
    return [{ source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] }];
  },
};

export default config;
