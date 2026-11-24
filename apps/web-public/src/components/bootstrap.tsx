'use client';

import { selectAuthStatus, selectIsMember, useGetDeityTodayQuery, useGetOfflinePackQuery, useRestoreSessionMutation } from '@chot-via/api-client';
import { toast, useCodeMessage } from '@chot-via/ui';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'use-intl';
import { offlinePackLoaded, wishSynced } from '@/features/wish/wishSlice';
import { initAnalytics } from '@/lib/analytics';
import { appStarted } from '@/store/listeners';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

/** Khởi động một lần: khôi phục bộ đếm/bản nháp, khôi phục phiên đăng nhập bằng cookie, cache lời chúc offline, đăng ký PWA. */
export function Bootstrap() {
  const dispatch = useAppDispatch();
  const [restore] = useRestoreSessionMutation();
  const { data: pack } = useGetOfflinePackQuery();
  const isMember = useAppSelector(selectIsMember);
  const status = useAppSelector(selectAuthStatus);
  const statusRef = useRef(status);
  statusRef.current = status;
  const { data: today } = useGetDeityTodayQuery(undefined, { skip: !isMember });
  const t = useTranslations('auth');
  const message = useCodeMessage();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    dispatch(appStarted());
    void restore();
    void initAnalytics();
    const url = new URL(window.location.href);
    const login = url.searchParams.get('login');
    if (login) {
      if (login === 'ok') toast.success(t('welcomeBack'));
      else toast.error(message('AUTH_PROVIDER_FAILED'));
      url.searchParams.delete('login');
      window.history.replaceState(null, '', url.toString());
    }
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
      } else {
        /* Bản dev: gỡ service worker và cache còn sót từ bản production từng chạy trên cùng địa chỉ, nếu không sẽ phục vụ file cũ và gây lỗi nạp module. */
        void navigator.serviceWorker.getRegistrations().then((list) => Promise.all(list.map((r) => r.unregister()))).catch(() => undefined);
        if ('caches' in window) void caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('cv-')).map((k) => caches.delete(k)))).catch(() => undefined);
      }
    }
  }, [dispatch, restore, t, message]);

  // Đăng nhập ở web admin (cùng cookie phiên) sau khi trang này đã mở: quay lại tab này là tự nhận phiên, không cần tải lại trang.
  useEffect(() => {
    let last = 0;
    const sync = (): void => {
      if (document.visibilityState !== 'visible' || statusRef.current !== 'guest') return;
      const now = Date.now();
      if (now - last < 3000) return;
      last = now;
      void restore();
    };
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => { document.removeEventListener('visibilitychange', sync); window.removeEventListener('focus', sync); };
  }, [restore]);

  // Các tab của web public báo cho nhau khi đăng nhập/đăng xuất (BroadcastChannel chỉ trong cùng một địa chỉ web; admin ở tên miền con dùng cookie chung và tự nhận khi quay lại tab).
  const channelRef = useRef<BroadcastChannel | null>(null);
  const prevStatus = useRef(status);
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
    if (before !== 'unknown' && before !== status && status !== 'unknown') channelRef.current?.postMessage(status);
  }, [status]);

  useEffect(() => {
    if (pack) dispatch(offlinePackLoaded(pack.texts));
  }, [pack, dispatch]);

  useEffect(() => {
    if (today) dispatch(wishSynced(today.map((e) => ({ at: e.at, titleCode: e.titleCode, templateId: 'server', offline: false }))));
  }, [today, dispatch]);

  return null;
}
