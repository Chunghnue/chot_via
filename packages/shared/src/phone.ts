/** Chuẩn hóa số điện thoại Việt Nam về dạng 0xxxxxxxxx; trả null nếu không hợp lệ. */
export function normalizeVnPhone(raw: string): string | null {
  const digits = raw.replace(/[\s.\-()]/g, '');
  const match = /^(?:\+?84|0)([35789]\d{8})$/.exec(digits);
  return match?.[1] ? `0${match[1]}` : null;
}

export function maskPhone(phone: string): string {
  return phone.length < 7 ? phone : `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}
