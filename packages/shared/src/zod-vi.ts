import { z } from 'zod';
import { viMessages } from './i18n';

const messages: Record<string, string> = viMessages.validation;
const fill = (text: string, params: Record<string, string | number>): string => text.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? ''));
const pick = (key: string, params: Record<string, string | number> = {}): string => fill(messages[key] ?? messages['invalid'] ?? '', params);

/**
 * Đặt bộ thông báo lỗi tiếng Việt cho mọi schema Zod (web và admin): thiếu giá trị, quá ngắn/dài, sai email/đường dẫn, không phải số…
 * Gọi một lần khi khởi động ứng dụng. Chữ nằm ở `i18n/vi/validation.json`, không viết cứng trong code.
 */
export function installVietnameseValidation(): void {
  z.setErrorMap((issue) => {
    switch (issue.code) {
      case 'invalid_type':
        if (issue.received === 'undefined' || issue.received === 'null') return { message: pick('required') };
        if (issue.expected === 'number' || issue.expected === 'nan') return { message: pick(issue.received === 'nan' ? 'required' : 'invalid_number') };
        if (issue.expected === 'integer') return { message: pick('invalid_integer') };
        if (issue.expected === 'boolean') return { message: pick('invalid_boolean') };
        if (issue.expected === 'date') return { message: pick('invalid_date') };
        return { message: pick('invalid_type') };
      case 'too_small': {
        const kind = issue.type === 'string' || issue.type === 'number' || issue.type === 'array' || issue.type === 'date' ? issue.type : 'number';
        if (kind === 'string' && Number(issue.minimum) <= 1) return { message: pick('required') };
        return { message: pick(`too_small_${kind}`, { min: Number(issue.minimum) }) };
      }
      case 'too_big': {
        const kind = issue.type === 'string' || issue.type === 'number' || issue.type === 'array' || issue.type === 'date' ? issue.type : 'number';
        return { message: pick(`too_big_${kind}`, { max: Number(issue.maximum) }) };
      }
      case 'invalid_string':
        if (issue.validation === 'email') return { message: pick('invalid_email') };
        if (issue.validation === 'url') return { message: pick('invalid_url') };
        if (issue.validation === 'uuid') return { message: pick('invalid_uuid') };
        return { message: pick('invalid_string') };
      case 'invalid_enum_value': return { message: pick('invalid_enum_value') };
      case 'invalid_date': return { message: pick('invalid_date') };
      case 'invalid_literal': return { message: pick('invalid_literal') };
      case 'invalid_union': return { message: pick('invalid_union') };
      case 'unrecognized_keys': return { message: pick('unrecognized_keys') };
      case 'not_multiple_of': return { message: pick('not_multiple_of', { multipleOf: Number(issue.multipleOf) }) };
      case 'not_finite': return { message: pick('not_finite') };
      default: return { message: pick('invalid') };
    }
  });
}

/** Một số schema đặt `message` là mã quy tắc (ví dụ "invalid_string"): đổi mã đó thành câu tiếng Việt, câu khác giữ nguyên. */
export function localizeValidationMessage(message: string | undefined): string | undefined {
  if (message === undefined || message === '') return message;
  const text = messages[message];
  return text === undefined ? message : fill(text, {});
}
