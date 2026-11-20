import { useSyncExternalStore } from 'react';

const subscribe = (): (() => void) => () => undefined;

/**
 * `false` ở lần render đầu (kể cả lúc hydrate) rồi `true`. Dùng cho khối hiển thị dữ liệu RTK Query xuất hiện ở nhiều chỗ trong trang
 * (ví dụ cột phải và khối inline ở màn nhỏ): tránh lệch HTML giữa máy chủ và trình duyệt khi một khối đã tải xong dữ liệu trước khi khối kia hydrate.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
