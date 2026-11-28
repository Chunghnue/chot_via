/* Service worker PWA (đăng ký ở production): offline cho vỏ ứng dụng + lời chúc dự phòng. Không cache request ghi dữ liệu. */
const VERSION = 'xv-v2';
const STATIC_CACHE = `${VERSION}-static`;
const API_CACHE = `${VERSION}-api`;
const SHELL = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

const staleWhileRevalidate = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => { if (response.ok) cache.put(request, response.clone()); return response; }).catch(() => cached);
  return cached ?? network;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === '/api/v1/wishes/offline-pack' || url.pathname === '/api/v1/catalog') {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/storage/')) return;

  /* Mạng trước, cache chỉ dùng khi offline: tránh phục vụ file cũ (đã gây lỗi "module factory is not available" khi chạy dev trên cùng địa chỉ). */
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(fetch(request).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(STATIC_CACHE).then((c) => c.put(request, copy)); } return res; }).catch(() => caches.match(request)));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((res) => { const copy = res.clone(); caches.open(STATIC_CACHE).then((c) => c.put(request, copy)); return res; }).catch(() => caches.match(request).then((hit) => hit ?? caches.match('/'))));
  }
});
