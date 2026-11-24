import { useEffect, useRef } from 'react';
import type { AuthState } from './auth-slice';
import { useRestoreSessionMutation } from './endpoints/core';

const MIN_GAP_MS = 3000;

/**
 * Giữ trạng thái đăng nhập/đăng xuất đồng bộ giữa web public và admin (cùng cookie phiên, khác tên miền con) và giữa các tab cùng một ứng dụng:
 * - Quay lại tab hoặc tab được focus: hỏi lại máy chủ bằng cookie (khách → nhận phiên mới; thành viên → mất phiên nếu đã đăng xuất ở nơi khác).
 *   Lỗi mạng tạm thời không làm mất phiên (xem restoreSession).
 * - Tab khác của cùng ứng dụng vừa đăng nhập/đăng xuất (BroadcastChannel, chỉ trong cùng một địa chỉ web) thì hỏi lại ngay.
 */
export function useSessionSync(status: AuthState['status']): void {
  const [restore] = useRestoreSessionMutation();
  const statusRef = useRef(status);
  statusRef.current = status;
  const channelRef = useRef<BroadcastChannel | null>(null);
  const prevStatus = useRef(status);

  useEffect(() => {
    let last = 0;
    const sync = (): void => {
      if (document.visibilityState !== 'visible' || statusRef.current === 'unknown') return;
      const now = Date.now();
      if (now - last < MIN_GAP_MS) return;
      last = now;
      void restore();
    };
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => { document.removeEventListener('visibilitychange', sync); window.removeEventListener('focus', sync); };
  }, [restore]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined;
    const channel = new BroadcastChannel('cv-auth');
    channelRef.current = channel;
    channel.onmessage = () => { void restore(); };
    return () => { channel.close(); channelRef.current = null; };
  }, [restore]);

  useEffect(() => {
    const before = prevStatus.current;
    prevStatus.current = status;
    if (before !== 'unknown' && status !== 'unknown' && before !== status) channelRef.current?.postMessage(status);
  }, [status]);
}
