# Triển khai Chốt Vía (Docker + Caddy)

Một máy chủ Linux chạy Docker. Caddy tự cấp HTTPS; chỉ cổng 80/443 mở ra ngoài.

```
Internet ─ Caddy (80/443, HTTPS tự động)
            ├─ chotvia.example.com        → web (Next.js)   ; /api, /storage → backend
            └─ admin.chotvia.example.com  → admin (tĩnh)    ; /api, /storage → backend
backend (NestJS) ─ postgres (volume postgres_data) ─ redis ─ volume uploads (ảnh tải lên)
```

## Chuẩn bị
1. Máy chủ Linux (khuyến nghị ≥ 2 vCPU, 2 GB RAM) có **Docker + Docker Compose**.
2. Hai tên miền (web và admin): trỏ bản ghi **A/AAAA** về IP máy chủ **trước** khi chạy (Caddy cần xác thực tên miền để lấy chứng chỉ).
3. Mở cổng **80, 443 (TCP và UDP)** trên tường lửa.
4. **SpeedSMS** (bắt buộc): ở production backend không cho dùng mã OTP dev nên không có khóa SMS thì không ai đăng nhập được. Dự phòng: eSMS.

## Cài đặt lần đầu
```bash
git clone <repo> /opt/chot-via && cd /opt/chot-via      # hoặc chép mã nguồn lên máy chủ
cp .env.production.example .env.production
nano .env.production            # điền WEB_DOMAIN, ADMIN_DOMAIN, mật khẩu, khóa SMS...
# Tạo bí mật:  openssl rand -hex 32   (dùng cho POSTGRES_PASSWORD và JWT_ACCESS_SECRET)

docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```
Thứ tự tự động: Postgres → `migrate` (tạo bảng, nạp danh mục khởi tạo và dữ liệu trang chủ gồm hàng nút hành động, chân trang, cấu hình phố; lần đầu đưa về bản trắng không có cửa hàng/thử thách mẫu; chạy lại an toàn) → backend → web/admin → Caddy.

Kiểm tra: `docker compose --env-file .env.production -f docker-compose.prod.yml ps` (tất cả `running`/`healthy`, riêng `migrate` là `exited 0`) rồi mở `https://<WEB_DOMAIN>` và `https://<ADMIN_DOMAIN>`.

## Việc làm ngay sau khi chạy
1. Đăng nhập admin bằng OTP gửi tới `SEED_ADMIN_PHONE`.
2. Vào **Cài đặt**: kiểm tra giới hạn, **tắt "Hiện dữ liệu mẫu"** khi chạy thật (dữ liệu mẫu không được nạp ở production vì `seed-demo-content` chỉ dùng cho dev).
3. Nhập **Cấp độ / Huy hiệu** (xem `docs/CAN-CHU-DU-AN-CUNG-CAP.md`), cửa hàng thật, chủ đề hot.
4. Thay ảnh/ bảng màu chính thức khi có (cần build lại ảnh `web`).

## Cập nhật phiên bản
```bash
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```
`migrate` chạy lại tự động và chỉ áp dụng migration mới. **Sao lưu trước khi cập nhật.**

## Sao lưu / khôi phục
- Sao lưu (database + ảnh), giữ 14 bản gần nhất: `./scripts/backup-db.sh`. Đặt cron hằng ngày: `0 3 * * * cd /opt/chot-via && ./scripts/backup-db.sh`. **Nên chép thư mục `backups/` ra nơi khác** (máy chủ hỏng thì mất cả bản sao lưu).
- Khôi phục database:
  ```bash
  gunzip -c backups/db-YYYYMMDD-HHMMSS.sql.gz | docker compose --env-file .env.production -f docker-compose.prod.yml exec -T postgres psql -U chotvia chotvia
  ```

## Biến môi trường
Xem `.env.production.example` (có chú thích). Biến `NEXT_PUBLIC_*` được đưa vào mã lúc **build**, nên đổi chúng cần `up -d --build`.

## Lưu ý bảo mật
- Không đưa `.env.production` vào git. Database/Redis không mở cổng ra ngoài.
- Cookie phiên là `Secure`, `HttpOnly`; chỉ chạy qua HTTPS (đã bật `COOKIE_SECURE=true`).
- Đăng nhập dùng chung giữa web public và admin: đặt `COOKIE_DOMAIN` bằng `WEB_DOMAIN` (admin là tên miền con của nó). Đổi giá trị này thì người đang đăng nhập phải đăng nhập lại một lần. Để trống thì cookie chỉ thuộc đúng host (hai trang không dùng chung phiên).
- Sentry/PostHog/Turnstile để trống thì tự tắt; PostHog dùng máy chủ EU, không gửi dữ liệu cá nhân.

## Đã kiểm và chưa kiểm
- Đã kiểm trên máy dev (không dùng Docker): build backend ra 5 file (`main`, `migrate`, `seed`, `seed-home`, `seed-baseline`); chạy `migrate` + `seed` (chạy lại seed không nhân đôi dữ liệu) rồi chạy API ở `NODE_ENV=production`; lệnh `pnpm deploy --legacy` dùng trong Dockerfile cho ra bản backend chạy được; build web dạng `standalone`, chạy `node server.js` — trang, proxy `/api`, ảnh, manifest và service worker hoạt động; build admin; `docker compose config` hợp lệ.
- **Chưa kiểm:** `docker build` các ảnh thật và `docker compose up` (Docker Desktop trên máy dev chưa chạy), Caddy cấp chứng chỉ thật, gửi SMS thật. Lần đầu triển khai nên chạy thử trên máy chủ thử hoặc subdomain thử trước.

## Máy chủ đã có nginx giữ cổng 80/443 (dùng chung nhiều site)
Dùng thêm file `docker-compose.behind-nginx.yml` + `deploy/Caddyfile.behind-nginx`: Caddy chỉ nghe `127.0.0.1:3095` (HTTP), nginx của máy chủ làm proxy tới cổng này (đặt `X-Forwarded-Proto`) và cấp chứng chỉ bằng certbot:
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.behind-nginx.yml up -d --build
```
Đã triển khai thử theo cách này ngày 20/11/2026 (không dùng OTP dev ở production; nếu bật OTP dev tạm thời phải giới hạn IP ở nginx). Build trong Docker cần `allowBuilds` trong `pnpm-workspace.yaml` (pnpm 12); trên máy ít RAM dùng `COMPOSE_PARALLEL_LIMIT=1`.
