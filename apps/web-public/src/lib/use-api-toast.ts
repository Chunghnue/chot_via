'use client';

import { toast, useCodeMessage } from '@chot-via/ui';
import { parseApiError } from '@chot-via/api-client';
import { useCallback } from 'react';

/** Hiển thị lỗi từ backend: backend chỉ trả mã, câu chữ lấy từ i18n (`codes.<MÃ>`). */
export function useApiToast() {
  const message = useCodeMessage();
  const error = useCallback((err: unknown): string => {
    const info = parseApiError(err);
    const text = message(info.code, info.params);
    toast.error(text);
    return text;
  }, [message]);
  const success = useCallback((code: string): void => { toast.success(message(code)); }, [message]);
  return { error, success, message };
}
