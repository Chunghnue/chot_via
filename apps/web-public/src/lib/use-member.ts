'use client';

import { selectAuthStatus, selectCurrentUser, selectIsMember, type AuthState } from '@xin-via/api-client';
import { useCallback } from 'react';
import { loginRequested, type LoginReason } from '@/features/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useMounted } from './use-mounted';

/**
 * Trạng thái đăng nhập an toàn cho hydrate: lần render đầu (kể cả lúc hydrate) luôn là "chưa biết" giống HTML máy chủ,
 * sau khi mount mới theo store. Tránh lệch HTML khi phiên đã khôi phục xong trước lúc một khối hydrate.
 */
export function useAuthStatus(): AuthState['status'] {
  const status = useAppSelector(selectAuthStatus);
  return useMounted() ? status : 'unknown';
}

export function useCurrentUser() {
  const user = useAppSelector(selectCurrentUser);
  return useMounted() ? user : null;
}

/** Đăng nhập theo hành động (FR-10): chỉ hỏi khi người dùng làm việc cần tài khoản. Trả về true nếu đã là thành viên. */
export function useRequireMember() {
  const dispatch = useAppDispatch();
  const mounted = useMounted();
  const isMember = useAppSelector(selectIsMember) && mounted;
  const user = useCurrentUser();
  const require = useCallback((reason: LoginReason): boolean => {
    if (!isMember) dispatch(loginRequested(reason));
    return isMember;
  }, [dispatch, isMember]);
  return { isMember, user, require };
}
