import { Logger } from '@nestjs/common';
import { z } from 'zod';
import { env } from '../../config/env';
import { DomainError } from '../../common/domain-error';

export interface SmsProvider { send(phone: string, code: string): Promise<void> }

/** Nội dung tin nhắn gửi tới điện thoại (không dấu để tương thích mọi nhà mạng). */
const otpContent = (code: string): string => `Ma xac thuc Chot Via cua ban la ${code}. Ma co hieu luc 5 phut, khong chia se cho bat ky ai.`;

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

export const SMS = Symbol('SMS_PROVIDER');

export function createSmsProvider(): SmsProvider {
  if (env.SMS_PROVIDER === 'speedsms') return new SpeedSmsProvider();
  if (env.SMS_PROVIDER === 'esms') return new EsmsProvider();
  return new DevSmsProvider();
}
