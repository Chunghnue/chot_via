import { parseApiError } from '@chot-via/api-client';
import { toast, useCodeMessage } from '@chot-via/ui';
import { useCallback } from 'react';

/** Hiển thị lỗi từ backend: backend chỉ trả mã, câu chữ lấy từ i18n (`codes.<MÃ>`). */
export function useApiToast() {
  const message = useCodeMessage();
  const error = useCallback((err: unknown): void => {
    const info = parseApiError(err);
    toast.error(message(info.code, info.params));
  }, [message]);
  return { error };
}
