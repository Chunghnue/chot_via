import qrcode from 'qrcode-generator';

/** Bốn mẫu thẻ chia sẻ theo tài liệu chiến lược (images/04-*.svg): nhận vía, khoe thành tích, kể khổ, mời ghé phố. */
export type ShareCardKind = 'receive' | 'brag' | 'story' | 'visit';

export interface ShareCardText {
  brand: string;
  tagline: string;
  scan: string;
  title: string;
  /** Tối đa hai dòng nội dung chính (đã tách sẵn). */
  lines: readonly string[];
}

const W = 1080;
const H = 1350;
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Tách chữ thành tối đa `max` dòng, mỗi dòng không quá `width` ký tự (cắt ở dấu cách; dư thì thêm "…"). */
export function wrapLines(text: string, width = 30, max = 2): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter((w) => w !== '');
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur !== '' && (cur + ' ' + w).length > width) { out.push(cur); cur = w; } else cur = cur === '' ? w : cur + ' ' + w;
    if (out.length === max) break;
  }
  if (out.length < max && cur !== '') out.push(cur);
  const used = out.join(' ').length;
  if (used < words.join(' ').length && out.length > 0) out[out.length - 1] = (out[out.length - 1] ?? '').replace(/[ .,;:!?]*$/, '') + '…';
  return out;
}

function qrRects(value: string, size: number, x0: number, y0: number): string {
  const qr = qrcode(0, 'M');
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  const cell = size / (n + 2);
  let d = '';
  for (let r = 0; r < n; r += 1) for (let c = 0; c < n; c += 1) if (qr.isDark(r, c)) d += `M${(x0 + (c + 1) * cell).toFixed(2)} ${(y0 + (r + 1) * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}z`;
  return `<rect x="${x0}" y="${y0}" width="${size}" height="${size}" rx="24" fill="#fff" stroke="#0c875c" stroke-width="4"/><path d="${d}" fill="#075c40"/>`;
}

/** SVG thẻ 1080×1350 đúng bố cục mẫu: khung trắng viền xanh, tên "Xin Vía", tiêu đề, hai dòng nội dung, mã QR về đúng trang, khẩu hiệu. */
export function buildCardSvg(t: ShareCardText, link: string): string {
  const [l1 = '', l2 = ''] = t.lines;
  const host = link.replace(/^https?:\/\//, '').slice(0, 44);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#e8f8ee"/><rect x="60" y="60" width="960" height="1230" rx="60" fill="white" stroke="#0c875c" stroke-width="4"/>`
    + `<g font-family="sans-serif" text-anchor="middle" fill="#075c40"><text x="540" y="180" font-size="64" font-weight="bold">${esc(t.brand)}</text>`
    + `<text x="540" y="520" font-size="49" font-weight="bold">${esc(t.title)}</text><text x="540" y="660" font-size="43">${esc(l1)}</text><text x="540" y="730" font-size="43">${esc(l2)}</text>`
    + `${qrRects(link, 260, 410, 800)}<text x="540" y="1110" font-size="26">${esc(t.scan)}</text><text x="540" y="1148" font-size="24" fill="#4b6b5c">${esc(host)}</text>`
    + `<text x="540" y="1230" font-size="32">${esc(t.tagline)}</text></g></svg>`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image'));
    img.src = src;
  });
}

/** Vẽ thẻ ra ảnh PNG (logo Thần Tài ở giữa phía trên). */
export async function renderCardPng(t: ShareCardText, link: string): Promise<Blob> {
  const svg = buildCardSvg(t, link);
  const [card, logo] = await Promise.all([
    loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`),
    loadImage('/images/logo-than-tai.webp').catch(() => null),
  ]);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  if (!g) throw new Error('canvas');
  g.drawImage(card, 0, 0, W, H);
  if (logo) g.drawImage(logo, 440, 215, 200, 200);
  return new Promise((resolve, reject) => cv.toBlob((b) => (b ? resolve(b) : reject(new Error('png'))), 'image/png'));
}

/** Chia sẻ ảnh thẻ bằng menu chia sẻ của thiết bị (Facebook, Zalo, Messenger… nếu có); không hỗ trợ thì tải ảnh về. Trả về 'shared' | 'saved'. */
export async function shareCardImage(t: ShareCardText, link: string, caption: string): Promise<'shared' | 'saved'> {
  const blob = await renderCardPng(t, link);
  const file = new File([blob], 'chot-via.png', { type: 'image/png' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], text: caption, url: link });
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'chot-via.png'; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'saved';
}
