import { parseApiError, useGetCatalogQuery, useLogoutMutation, useRequestOtpMutation, useVerifyOtpMutation } from '@chot-via/api-client';
import { Button, Card, CloverMark, FieldError, Input, Label, cn, toast, useCodeMessage } from '@chot-via/ui';
import { OtpRequestBodySchema, OtpVerifyBodySchema, type OtpRequestBody, type OtpVerifyBody } from '@chot-via/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'use-intl';

const PROVIDERS = ['google', 'facebook'] as const;

/** Biểu tượng nhà cung cấp đăng nhập: chữ G nhiều màu của Google, chữ f trắng của Facebook. */
function ProviderIcon({ provider }: { provider: (typeof PROVIDERS)[number] }) {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 48 48" className="size-5 shrink-0" aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
        <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
    );
  }
  return <svg viewBox="0 0 24 24" className="size-5 shrink-0 fill-current" aria-hidden><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z" /></svg>;
}

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
        <div className="mb-4 flex items-center gap-3"><CloverMark className="size-12" /><div><h1 className="font-display text-2xl font-extrabold text-primary-strong">{t('title')}</h1><p className="text-sm text-ink-muted">{t('subtitle')}</p></div></div>
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
            {catalog?.devOtpHint ? <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs font-semibold text-warning">{t('devHint', { code: catalog.devOtpHint })}</p> : null}
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
          {PROVIDERS.map((p) => {
            const on = catalog?.authProviders[p] === true;
            const cls = cn('flex h-12 items-center justify-center gap-3 rounded-full text-sm font-bold transition active:scale-[0.98]', p === 'facebook' ? 'bg-brand-facebook text-on-primary hover:brightness-110' : 'border border-border bg-surface text-ink shadow-card hover:bg-surface-muted');
            const inner = <><ProviderIcon provider={p} />{t(p)}</>;
            return on ? (
              <a key={p} href={`/api/v1/auth/oauth/${p}/start?app=admin&returnTo=/`} className={cls}>{inner}</a>
            ) : (
              <button key={p} type="button" className={cls} onClick={() => toast(t('providerOff', { name: p === 'google' ? 'Google' : 'Facebook' }))}>{inner}</button>
            );
          })}
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
