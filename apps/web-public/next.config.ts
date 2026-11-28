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
  transpilePackages: ['@xin-via/shared', '@xin-via/ui', '@xin-via/api-client', '@xin-via/scene-3d'],
  /** Web và API cùng nguồn gốc (same-origin) → cookie phiên httpOnly hoạt động, không cần CORS. */
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backend}/api/:path*` },
      { source: '/storage/:path*', destination: `${backend}/storage/:path*` },
    ];
  },
  async headers() {
    // Ảnh và model 3D đổi hiếm (thay file cùng tên là đổi ảnh): giữ trong bộ nhớ trình duyệt 1 ngày, sau đó dùng bản cũ trong lúc tải bản mới ngầm, để lần vào thứ hai gần như tức thì.
    const assetCache = [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }];
    return [
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] },
      { source: '/images/:path*', headers: assetCache },
      { source: '/3d/:path*', headers: assetCache },
    ];
  },
};

export default config;
