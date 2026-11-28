#!/usr/bin/env sh
# Sao lưu database (và ảnh tải lên) vào thư mục backups/. Chạy trên máy chủ, ví dụ bằng cron hằng ngày:
#   0 3 * * * cd /opt/xin-via && ./scripts/backup-db.sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p backups
STAMP=$(date +%Y%m%d-%H%M%S)
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T postgres pg_dump -U xinvia xinvia | gzip > "backups/db-$STAMP.sql.gz"
docker run --rm -v xinvia_uploads:/data -v "$(pwd)/backups:/backup" alpine tar czf "/backup/uploads-$STAMP.tar.gz" -C /data .
# Giữ 14 bản gần nhất
ls -1t backups/db-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
ls -1t backups/uploads-*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
echo "Đã sao lưu: backups/db-$STAMP.sql.gz"
