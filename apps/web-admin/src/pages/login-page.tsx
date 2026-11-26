import { parseApiError, useGetCatalogQuery, useLogoutMutation, useRequestOtpMutation, useVerifyOtpMutation } from '@chot-via/api-client';
import { Button, Card, FieldError, Input, Label, Notice, OAuthButtons, toast, useCodeMessage } from '@chot-via/ui';
import { OtpRequestBodySchema, OtpVerifyBodySchema, type OtpRequestBody, type OtpVerifyBody } from '@chot-via/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'use-intl';

const PROVIDERS = ['google', 'facebook'] as const;

export function LoginPage() {
  const t = useTranslations('admin.login');
  const message = useCodeMessage();
  const { data: catalog } = useGetCatalogQuery();
  const [requestOtp, { isLoading: sending }] = useRequestOtpMutation();
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation();
  const [phone, setPhone] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const phoneForm = useForm<OtpRequestBody>({ resolver: zodResolver(OtpRequestBodySchema), defaultValues: { phone: '' } });
  const codeForm = useForm<OtpVerifyBody>({ resolver: zodResolver(OtpVerifyBodySchema), defaultValues: { phone: '', code: '' } });

  useEffect(() => {
    if (resendAt <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [resendAt]);
  const left = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const send = async (v: OtpRequestBody): Promise<void> => {
    setError(null);
    try {
      const r = await requestOtp(v).unwrap();
      setPhone(v.phone);
      codeForm.reset({ phone: v.phone, code: '' });
      setNow(Date.now());
      setResendAt(Date.now() + r.resendAfterSec * 1000);
    } catch (e) { const i = parseApiError(e); setError(message(i.code, i.params)); }
  };
  const verify = async (v: OtpVerifyBody): Promise<void> => {
    setError(null);
    try { await verifyOtp(v).unwrap(); } catch (e) { const i = parseApiError(e); setError(message(i.code, i.params)); }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-linear-to-b from-primary-soft to-app p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-3"><img src="/logo-than-tai.webp" alt="" aria-hidden className="size-12 object-contain" draggable={false} /><div><h1 className="font-display text-2xl font-extrabold text-primary-strong">{t('title')}</h1><p className="text-sm text-ink-muted">{t('subtitle')}</p></div></div>
        {phone === null ? (
          <form onSubmit={phoneForm.handleSubmit(send)} className="flex flex-col gap-3" noValidate>
            <div><Label htmlFor="phone">{t('phone')}</Label><Input id="phone" type="tel" inputMode="tel" autoComplete="tel" {...phoneForm.register('phone')} /></div>
            <FieldError message={error ?? undefined} />
            <Button type="submit" size="lg" loading={sending}>{t('sendOtp')}</Button>
          </form>
        ) : (
          <form onSubmit={codeForm.handleSubmit(verify)} className="flex flex-col gap-3" noValidate>
            <Label htmlFor="otp">{t('otp')}</Label>
            <Input id="otp" inputMode="numeric" maxLength={6} autoComplete="one-time-code" className="text-center font-display text-2xl tracking-[0.5em]" {...codeForm.register('code')} />
            {catalog?.devOtpHint ? <Notice>{t('devHint', { code: catalog.devOtpHint })}</Notice> : null}
            <FieldError message={error ?? undefined} />
            <Button type="submit" size="lg" loading={verifying}>{t('verify')}</Button>
            <div className="flex justify-between text-sm">
              <button type="button" className="font-semibold text-primary-strong disabled:text-ink-subtle" disabled={left > 0 || sending} onClick={() => void send({ phone })}>{left > 0 ? t('resendIn', { seconds: left }) : t('resend')}</button>
              <button type="button" className="text-ink-muted" onClick={() => { setPhone(null); setError(null); }}>{t('changePhone')}</button>
            </div>
          </form>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <p className="text-center text-xs text-ink-subtle">{t('socialDivider')}</p>
          <OAuthButtons providers={PROVIDERS} enabled={catalog?.authProviders} hrefFor={(p) => `/api/v1/auth/oauth/${p}/start?app=admin&returnTo=/`} label={(p) => (p === 'google' ? t('google') : t('facebook'))} onUnavailable={(p) => toast(t('providerOff', { name: p === 'google' ? 'Google' : 'Facebook' }))} />
        </div>
      </Card>
    </div>
  );
}

export function NoAccess() {
  const t = useTranslations('admin.login');
  const [logout] = useLogoutMutation();
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="flex max-w-md flex-col items-center gap-4 p-8 text-center"><span aria-hidden className="text-5xl">🔒</span><p className="text-ink-muted">{t('noAccess')}</p><Button onClick={() => void logout()}>{t('logout')}</Button></Card>
    </div>
  );
}
