# packages/api-client — RTK Query có kiểu

Một `baseApi` (`src/base.ts`) + `injectEndpoints` theo nhóm trong `src/endpoints/` (`core`, `places`, `posts`, `community`, `admin`). Mỗi endpoint khai báo schema Zod cho phản hồi (`transformResponse: unwrap(Schema)` / `unwrapPaged`) và kiểu tham số rõ ràng (không `any`).

- `base.ts`: gắn header CSRF, token truy cập từ `auth-slice`, tự làm mới phiên khi 401 qua `/auth/refresh`, các tag cache (`Posts`, `Places`, `AdminList`, `AdminCatalog`…).
- `auth-slice.ts`: phiên (`status: unknown|guest|member`, người dùng, điểm) + selector (`selectIsMember`, `selectCurrentUser`…).
- `errors.ts`: `parseApiError` → `{code, params}` để UI ánh xạ sang chữ.
- Endpoint có hàm trong `providesTags` cần **khai báo generics tường minh**; query không tham số dùng `(_arg: void)`.
- `admin.ts` có `crud()` sinh 4 thao tác cho từng danh mục cấu hình, kèm các endpoint dữ liệu mẫu (`demo*`).
