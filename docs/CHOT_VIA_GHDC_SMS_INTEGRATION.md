# Tích hợp GHDC SMS OTP cho Xin Vía

## Mục tiêu

Tích hợp nhà cung cấp SMS GHDC vào backend Xin Vía để luồng gửi và xác
minh OTP chạy được end-to-end.

**Nguyên tắc:** giữ nguyên cơ chế tạo OTP, lưu OTP, thời hạn OTP, giới
hạn gửi và xác minh OTP hiện tại của Xin Vía. Chỉ bổ sung adapter gửi
SMS GHDC. Không thay đổi nghiệp vụ xác thực nếu không thật sự cần thiết.

## Thông tin GHDC đã có

-   Base URL: `https://sms.ghdc.vn/api`
-   Email tài khoản: `aibat@aibat.vn`
-   Mật khẩu: được cấu hình trực tiếp trên VPS trong `.env.production`;
    không ghi vào Git, mã nguồn, log hoặc tài liệu.
-   `cp_id`: `118`
-   `temp_id`: `34`
-   Nội dung template đã đăng ký (phải giữ nguyên chính xác):

``` text
{OTP} la ma xac minh Aibat cua ban
```

Không tự ý thêm dấu câu, dấu tiếng Việt, khoảng trắng, tiền tố/hậu tố
hoặc thay đổi nội dung template. Xác nhận với API cũ cách truyền OTP vào
template (ví dụ tham số riêng hay content đã thay placeholder); không tự
suy đoán.

## Yêu cầu bắt buộc trước khi triển khai

### 1. Khảo sát hệ thống cũ và tìm API contract thực tế

Tìm trong các source project có sẵn trên máy/VPS đoạn code đã gửi SMS
thành công qua GHDC. Ưu tiên tìm các chuỗi:

-   `sms.ghdc.vn`
-   `cp_id`
-   `temp_id`
-   `aibat.vn`

Bỏ qua `node_modules`, `.git`, thư mục build (`dist`, `build`) và file
`.env*`. Không in hoặc đọc giá trị bí mật từ file môi trường.

Nếu tìm thấy đoạn code cũ: - Xác định chính xác HTTP method, endpoint
đầy đủ, headers, cách xác thực, tên và kiểu dữ liệu các trường
request. - Xác định cách truyền `cp_id`, `temp_id`, số điện thoại và
OTP/template. - Xác định response thành công/thất bại và mã lỗi. - Kiểm
tra cách chuẩn hóa số điện thoại trong hệ thống cũ. - Dùng đúng API
contract đã được chứng minh từ code cũ.

Nếu không tìm thấy code cũ hoặc không đủ căn cứ xác định API contract: -
**Dừng trước khi viết phần gọi API GHDC.** - Báo rõ thông tin còn thiếu
và yêu cầu người dùng cung cấp vị trí hệ thống cũ hoặc ví dụ
request/response đã che thông tin bí mật. - Không tự đoán endpoint,
method, headers, payload hoặc cơ chế auth. - Không thử các endpoint ngẫu
nhiên trên dịch vụ thật.

### 2. Khảo sát code Xin Vía hiện tại

Đọc tối thiểu các file: - `apps/backend/src/modules/auth/sms.ts` -
`apps/backend/src/config/env.ts` -
`apps/backend/src/modules/auth/auth.service.ts` - Các test liên quan tới
auth/OTP/SMS (nếu có).

Xác định cách `SmsProvider` được inject và cách xử lý lỗi hiện tại. Giữ
nguyên behavior của `DevSmsProvider`, `SpeedSmsProvider`,
`EsmsProvider`.

## Thiết kế triển khai

### 3. Bổ sung cấu hình môi trường

Trong `apps/backend/src/config/env.ts`: - Mở rộng `SMS_PROVIDER` để nhận
thêm `ghdc`. - Thêm biến cấu hình GHDC, tên gợi ý:

``` env
GHDC_SMS_BASE_URL=https://sms.ghdc.vn/api
GHDC_SMS_EMAIL=aibat@aibat.vn
GHDC_SMS_PASSWORD=
GHDC_SMS_CP_ID=118
GHDC_SMS_TEMP_ID=34
```

-   Kiểu dữ liệu `cp_id` và `temp_id` phải phù hợp với API contract thực
    tế (string hay number).
-   Có validate cấu hình khi `SMS_PROVIDER=ghdc`: các trường bắt buộc
    không được rỗng; URL hợp lệ; không cho chạy nếu thiếu mật khẩu.
-   Không bắt buộc GHDC credentials khi đang dùng provider khác.
-   Không đặt mật khẩu mặc định trong schema.
-   Không ghi secret ra console/log.

### 4. Bổ sung GhdcSmsProvider

Trong `apps/backend/src/modules/auth/sms.ts`: - Implement class
`GhdcSmsProvider implements SmsProvider`. - Dùng `fetch`/HTTP client
theo pattern và phiên bản runtime hiện tại của dự án. - Dùng đúng
endpoint, method, authentication, headers và payload lấy từ code cũ đã
xác minh. - Gửi đúng số điện thoại theo quy tắc chuẩn hóa đã có trong dự
án/hệ thống cũ. - Dùng OTP do `send(phone, code)` nhận vào. - Nội
dung/template phải đúng mẫu đã đăng ký:
`{OTP} la ma xac minh Aibat cua ban` - Không tự tạo OTP mới trong
provider. - Không log OTP, password, token, request Authorization header
hoặc dữ liệu xác thực. - Có timeout hợp lý; xử lý network error,
timeout, HTTP error, response không hợp lệ và mã lỗi nghiệp vụ. - Chỉ
resolve khi response xác nhận request được nhà cung cấp chấp nhận theo
contract. Nếu thất bại, throw `DomainError('AUTH_OTP_SEND_FAILED')` hoặc
cơ chế lỗi tương đương đang dùng trong dự án. - Không để response chứa
credential hoặc dữ liệu nhạy cảm lọt vào log. - `createSmsProvider()`
chọn `GhdcSmsProvider` khi `SMS_PROVIDER === 'ghdc'`. - Không thay đổi
provider mặc định hoặc logic các provider hiện có.

### 5. Bảo toàn luồng OTP hiện tại

Trong `auth.service.ts` và các phần liên quan: - Không thay đổi cách
sinh OTP, thời hạn 5 phút, lưu trữ, rate limit, resend cooldown, số lần
thử hoặc xác minh OTP. - Không trả OTP trong API response. - Không ghi
OTP ra log ở production. - Nếu gửi SMS thất bại, xử lý theo semantics
hiện tại; không để người dùng tưởng SMS đã gửi thành công. - Không thay
đổi nội dung SMS của SpeedSMS/eSMS trừ khi có yêu cầu riêng. - Lưu ý nội
dung GHDC dùng thương hiệu Aibat theo template được cung cấp. Không tự
đổi thành Xin Vía; ghi nhận đây là template được chủ hệ thống cung cấp.

## Cấu hình `.env.production`

Chỉ chỉnh trên VPS, không commit file này:

``` env
SMS_PROVIDER=ghdc
GHDC_SMS_BASE_URL=https://sms.ghdc.vn/api
GHDC_SMS_EMAIL=aibat@aibat.vn
GHDC_SMS_PASSWORD=<nhập trực tiếp trên VPS>
GHDC_SMS_CP_ID=118
GHDC_SMS_TEMP_ID=34
```

Các biến `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET`, domain và cấu hình
production hiện có phải được giữ nguyên. Không ghi lại hoặc thay thế
chúng trong quá trình tích hợp.

Đảm bảo quyền file:

``` bash
chmod 600 .env.production
```

Không yêu cầu người dùng gửi password, token hay nội dung
`.env.production` lên chat/issue/PR.

## Kiểm thử

### 6. Kiểm thử tự động

Bổ sung unit tests cho `GhdcSmsProvider` bằng mock HTTP/fetch; không gọi
dịch vụ thật trong unit test.

Kiểm tra tối thiểu: 1. Request gửi đúng endpoint, method, headers và
payload theo API contract đã xác minh. 2. Truyền đúng `cp_id`,
`temp_id`, số điện thoại và OTP. 3. Nội dung template chính xác, không
tự thêm/sửa nội dung. 4. Response thành công được nhận diện đúng. 5.
HTTP lỗi, response sai schema, mã lỗi nghiệp vụ, timeout và network
error đều được xử lý là thất bại. 6. Không có credential/OTP trong log.
7. SpeedSMS, eSMS và dev provider không bị ảnh hưởng.

Chạy các lệnh lint, typecheck và test phù hợp với scripts thực tế trong
`package.json`. Không tự đoán tên script; kiểm tra `package.json` trước.

### 7. Kiểm thử tích hợp có kiểm soát

Chỉ sau khi API contract đã được xác minh và người dùng đồng ý gửi SMS
thật:

1.  Kiểm tra DNS/TLS/kết nối HTTPS từ VPS tới host GHDC; không gửi
    credential trong bước kiểm tra kết nối.
2.  Kiểm tra cấu hình thiếu/đủ mà không in giá trị secret.
3.  Gửi một OTP tới số điện thoại thử nghiệm do người dùng chỉ định và
    được phép sử dụng.
4.  Kiểm tra nội dung SMS nhận được đúng template đã đăng ký.
5.  Thử nhập OTP đúng và xác nhận thành công.
6.  Thử OTP sai/hết hạn và xác nhận bị từ chối như behavior hiện tại.
7.  Thử tình huống GHDC từ chối hoặc timeout; API Xin Vía không được
    báo gửi thành công giả.
8.  Không gửi nhiều SMS lặp lại trong quá trình test.

Lưu ý: response API thành công có thể chỉ xác nhận nhà cung cấp đã tiếp
nhận yêu cầu, không đảm bảo SMS đã tới máy. Nếu API có trạng thái tra
cứu delivery, kiểm tra thêm theo tài liệu/code cũ.

## Quy tắc an toàn khi làm việc trên VPS

-   Không chạy `docker compose up`, `down`, `restart`, `build` hoặc
    migration production khi chưa được người dùng cho phép rõ ràng.
-   Không thay đổi Nginx Proxy Manager, DNS, firewall, port hoặc cấu
    hình dự án khác.
-   Không xóa volume/database, không chạy lệnh reset/seed lại dữ liệu
    production.
-   Không sửa các file ngoài phạm vi cần thiết.
-   Trước khi sửa, kiểm tra `git status` và giữ nguyên thay đổi chưa
    commit của người dùng.
-   Không commit `.env.production`, password, token hoặc secret.
-   Không đưa secret vào command-line argument, shell history, output
    hoặc log.
-   Nếu cần tạo file test, không chứa credential thật.

## Quy trình làm việc bắt buộc

Chia thành các bước nhỏ và báo cáo sau mỗi bước:

1.  **Khảo sát:** tìm API contract GHDC trong code cũ; đọc code auth
    Xin Vía. Chưa sửa file.
2.  **Đề xuất:** báo endpoint/method/auth/payload/response đã tìm thấy
    và danh sách file sẽ sửa. Chờ người dùng xác nhận.
3.  **Triển khai:** sửa cấu hình và provider GHDC; không deploy.
4.  **Kiểm tra:** chạy lint/typecheck/unit test; báo kết quả và các giới
    hạn.
5.  **Cấu hình VPS:** hướng dẫn người dùng tự nhập credential vào
    `.env.production`; không yêu cầu gửi secret.
6.  **Kiểm thử SMS thật:** chỉ thực hiện sau khi người dùng xác nhận;
    dùng một số điện thoại thử nghiệm được chỉ định.
7.  **Triển khai production:** chỉ khi người dùng cho phép rõ ràng;
    trước khi chạy Compose/migration phải nêu chính xác lệnh và ảnh
    hưởng dự kiến.

Sau mỗi bước, dừng và chờ người dùng xác nhận mới chuyển bước tiếp theo.

## Tiêu chí hoàn thành

-   `SMS_PROVIDER=ghdc` được validate và khởi tạo provider đúng.
-   OTP được tạo/xác minh bởi logic hiện tại của Xin Vía.
-   GHDC nhận đúng request theo API contract đã xác minh.
-   SMS tới điện thoại với đúng template.
-   Các provider cũ vẫn hoạt động.
-   Unit tests, lint và typecheck liên quan đạt.
-   Không rò rỉ secret/OTP trong source, Git, API response hoặc log.
-   Không có thay đổi production/deploy ngoài phạm vi được người dùng
    phê duyệt.
