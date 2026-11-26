import { Logger } from '@nestjs/common';
import { z } from 'zod';
import { env } from '../../config/env';
import { DomainError } from '../../common/domain-error';

export interface SmsProvider { send(phone: string, code: string): Promise<void> }

/** Nội dung tin nhắn gửi tới điện thoại (không dấu để tương thích mọi nhà mạng). */
const otpContent = (code: string): string => `Ma xac thuc Xin Via cua ban la ${code}. Ma co hieu luc 5 phut, khong chia se cho bat ky ai.`;

/** Dev: chỉ in OTP ra log máy chủ, không gửi SMS thật. Production không bao giờ dùng provider này. */
class DevSmsProvider implements SmsProvider {
  private readonly logger = new Logger('SMS[dev]');
  send(phone: string, code: string): Promise<void> {
    this.logger.warn(`OTP cho ${phone}: ${code} (chế độ dev, không gửi SMS thật)`);
    return Promise.resolve();
  }
}

const SpeedSmsResponse = z.object({ status: z.string() });
class SpeedSmsProvider implements SmsProvider {
  async send(phone: string, code: string): Promise<void> {
    const auth = Buffer.from(`${env.SPEEDSMS_ACCESS_TOKEN}:x`).toString('base64');
    const res = await fetch('https://api.speedsms.vn/index.php/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({ to: [phone], content: otpContent(code), sms_type: env.SPEEDSMS_SENDER ? 2 : 4, sender: env.SPEEDSMS_SENDER }),
    });
    const parsed = SpeedSmsResponse.safeParse(await res.json());
    if (!res.ok || !parsed.success || parsed.data.status !== 'success') throw new DomainError('AUTH_OTP_SEND_FAILED');
  }
}

const EsmsResponse = z.object({ CodeResult: z.string() });
/** Phương án dự phòng khi cần đổi nhà cung cấp OTP. */
class EsmsProvider implements SmsProvider {
  async send(phone: string, code: string): Promise<void> {
    const res = await fetch('https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ApiKey: env.ESMS_API_KEY, SecretKey: env.ESMS_SECRET_KEY, Phone: phone, Content: otpContent(code), SmsType: '8', IsUnicode: '0' }),
    });
    const parsed = EsmsResponse.safeParse(await res.json());
    if (!res.ok || !parsed.success || parsed.data.CodeResult !== '100') throw new DomainError('AUTH_OTP_SEND_FAILED');
  }
}

/** Cấu hình GHDC: đăng nhập bằng email + mật khẩu để lấy token, rồi gửi tin theo mẫu đã đăng ký (cp_id, temp_id). */
export interface GhdcSmsConfig { baseUrl: string; email: string; password: string; cpId: string; tempId: string }

const GHDC_TIMEOUT_MS = 10_000;

/** Nội dung tin nhắn OTP gửi qua GHDC (chủ dự án chốt 24/11/2026: "Mã OTP của bạn là {OTP}"). */
export const ghdcContent = (code: string): string => `Mã OTP của bạn là ${code}`;

const GhdcLoginResponse = z.object({ token: z.string().trim().min(1) });
/**
 * Phản hồi của /sendSMS khi nhà cung cấp nhận tin (đã quan sát thực tế): một chuỗi JSON lồng trong JSON, giải ra `{ status: 1, mnp, carrier, smsid }`.
 * Chỉ `status` bằng 1 mới là đã nhận; mọi giá trị khác hoặc dạng khác đều coi là thất bại.
 */
const GhdcSendResult = z.object({ status: z.union([z.literal(1), z.literal('1')]) });
function parseGhdcSendBody(raw: unknown): z.SafeParseReturnType<unknown, { status: 1 | '1' }> {
  let value = raw;
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { value = null; } }
  return GhdcSendResult.safeParse(value);
}

/**
 * GHDC (theo đúng cách hệ thống Aibat cũ đang gọi): mỗi lần gửi đăng nhập `POST {base}/auth/login` `{email, password}` lấy `token`, rồi
 * `POST {base}/sendSMS` `{temp_id, cp_id, isdn, content, token}` (token nằm trong thân yêu cầu). `cp_id` và `temp_id` gửi dạng chuỗi như hệ thống cũ.
 * Thành công khi cả hai bước trả HTTP 2xx (đăng nhập phải có token, `/sendSMS` phải trả `status` = 1); mọi lỗi mạng, quá thời gian, HTTP lỗi hoặc phản hồi sai
 * đều ném AUTH_OTP_SEND_FAILED. Giữ kiểm tra chứng chỉ TLS (hệ thống cũ tắt, nhưng chứng chỉ của GHDC hợp lệ). Không ghi log OTP, mật khẩu, token hay thân phản hồi.
 */
export class GhdcSmsProvider implements SmsProvider {
  private readonly logger = new Logger('SMS[ghdc]');

  constructor(private readonly config: GhdcSmsConfig, private readonly fetchImpl: typeof fetch = fetch) {}

  private async post(path: string, body: Record<string, string>): Promise<Response> {
    try {
      return await this.fetchImpl(`${this.config.baseUrl.replace(/\/+$/, '')}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(GHDC_TIMEOUT_MS),
      });
    } catch {
      this.logger.warn(`GHDC ${path}: lỗi mạng hoặc quá thời gian chờ`);
      throw new DomainError('AUTH_OTP_SEND_FAILED');
    }
  }

  private fail(step: string, why: string): never {
    this.logger.warn(`GHDC ${step}: ${why}`);
    throw new DomainError('AUTH_OTP_SEND_FAILED');
  }

  private async login(): Promise<string> {
    const res = await this.post('/auth/login', { email: this.config.email, password: this.config.password });
    if (!res.ok) return this.fail('/auth/login', `HTTP ${res.status}`);
    const parsed = GhdcLoginResponse.safeParse(await res.json().catch(() => null));
    if (!parsed.success) return this.fail('/auth/login', 'phản hồi không có token');
    return parsed.data.token;
  }

  async send(phone: string, code: string): Promise<void> {
    const token = await this.login();
    const res = await this.post('/sendSMS', { temp_id: this.config.tempId, cp_id: this.config.cpId, isdn: phone, content: ghdcContent(code), token });
    if (!res.ok) return this.fail('/sendSMS', `HTTP ${res.status}`);
    const parsed = parseGhdcSendBody(await res.json().catch(() => null));
    if (!parsed.success) return this.fail('/sendSMS', 'nhà cung cấp không xác nhận đã nhận tin (status khác 1 hoặc phản hồi sai dạng)');
  }
}

export const SMS = Symbol('SMS_PROVIDER');

export function createSmsProvider(): SmsProvider {
  if (env.SMS_PROVIDER === 'speedsms') return new SpeedSmsProvider();
  if (env.SMS_PROVIDER === 'esms') return new EsmsProvider();
  if (env.SMS_PROVIDER === 'ghdc')
    return new GhdcSmsProvider({
      baseUrl: env.GHDC_SMS_BASE_URL,
      email: env.GHDC_SMS_EMAIL,
      password: env.GHDC_SMS_PASSWORD,
      cpId: env.GHDC_SMS_CP_ID,
      tempId: env.GHDC_SMS_TEMP_ID,
    });
  return new DevSmsProvider();
}
