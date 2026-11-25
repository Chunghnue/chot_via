'use client';

import { parseApiError, useGetCatalogQuery, useRequestOtpMutation, useVerifyOtpMutation } from '@chot-via/api-client';
import { Button, FieldError, Input, Label, Sheet, cn, toast, useCodeMessage } from '@chot-via/ui';
import { OtpRequestBodySchema, OtpVerifyBodySchema, type OAuthProvider, type OtpRequestBody, type OtpVerifyBody } from '@chot-via/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'use-intl';
import { track } from '@/lib/analytics';
import { useTurnstile } from '@/components/turnstile';
import { loginDismissed, selectLogin } from '@/features/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const PROVIDERS: OAuthProvider[] = ['google', 'facebook', 'apple'];

/** Biểu tượng nhà cung cấp đăng nhập: chữ G nhiều màu của Google, chữ f trắng của Facebook. */
function ProviderIcon({ provider }: { provider: OAuthProvider }) {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 48 48" className="size-5 shrink-0" aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
        <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.100 0 24s.9 7.600 2.600 10.800l7.900-6.100z" />
        <path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.500-5.800c-2.100 1.400-4.800 2.300-8.400 2.300-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z" />
      </svg>
    );
  }
  if (provider === 'facebook') return <svg viewBox="0 0 24 24" className="size-5 shrink-0 fill-current" aria-hidden><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z" /></svg>;
  return <span aria-hidden className="text-lg leading-none"></span>;
}

/** SCR-09: đăng nhập/đăng ký theo hành động bằng SMS OTP (P0); Google/Facebook/Apple hiện khi đã cấu hình (P1). */
export function LoginSheet() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const message = useCodeMessage();
  const dispatch = useAppDispatch();
  const login = useAppSelector(selectLogin);
  const { data: catalog } = useGetCatalogQuery();
  const [requestOtp, { isLoading: requesting }] = useRequestOtpMutation();
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation();
  const [phone, setPhone] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [serverError, setServerError] = useState<string | null>(null);
  const turnstile = useTurnstile();

  const phoneForm = useForm<OtpRequestBody>({ resolver: zodResolver(OtpRequestBodySchema), defaultValues: { phone: '' } });
  const codeForm = useForm<OtpVerifyBody>({ resolver: zodResolver(OtpVerifyBodySchema), defaultValues: { phone: '', code: '' } });

  useEffect(() => {
    if (resendAt <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [resendAt]);

  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const sendOtp = async (values: OtpRequestBody): Promise<void> => {
    setServerError(null);
    try {
      const result = await requestOtp({ ...values, ...(turnstile.token ? { turnstileToken: turnstile.token } : {}) }).unwrap();
      setPhone(values.phone);
      codeForm.reset({ phone: values.phone, code: '' });
      setNow(Date.now());
      setResendAt(Date.now() + result.resendAfterSec * 1000);
    } catch (error) {
      const info = parseApiError(error);
      setServerError(message(info.code, info.params));
    }
  };

  const verify = async (values: OtpVerifyBody): Promise<void> => {
    setServerError(null);
    try {
      const session = await verifyOtp(values).unwrap();
      track('signup_after_action', { trigger_action: login.reason, completed: true });
      toast.success(session.isNewUser ? t('welcome') : t('welcomeBack'));
      setPhone(null);
      phoneForm.reset();
    } catch (error) {
      const info = parseApiError(error);
      setServerError(message(info.code, info.params));
    }
  };

  const close = (open: boolean): void => {
    if (open) return;
    if (login.open) track('signup_after_action', { trigger_action: login.reason, completed: false });
    dispatch(loginDismissed());
    setServerError(null);
    setPhone(null);
  };

  const returnTo = typeof window === 'undefined' ? '/' : `${window.location.pathname}${window.location.search}`;

  return (
    <Sheet open={login.open} onOpenChange={close} title={t('title')} description={t(`reason.${login.reason}`)} closeLabel={tc('close')}>
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-primary-strong">{t(`reason.${login.reason}`)}</p>

        {phone === null ? (
          <form onSubmit={phoneForm.handleSubmit(sendOtp)} className="flex flex-col gap-3" noValidate>
            <div>
              <Label htmlFor="login-phone">{t('phoneLabel')}</Label>
              <Input id="login-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={t('phonePlaceholder')} aria-invalid={!!phoneForm.formState.errors.phone} {...phoneForm.register('phone')} />
              <FieldError message={phoneForm.formState.errors.phone ? message('AUTH_INVALID_PHONE') : undefined} />
            </div>
            <div ref={turnstile.containerRef} />
            <FieldError message={serverError ?? undefined} />
            <Button type="submit" size="lg" loading={requesting} disabled={!turnstile.ready}>{t('sendOtp')}</Button>
          </form>
        ) : (
          <form onSubmit={codeForm.handleSubmit(verify)} className="flex flex-col gap-3" noValidate>
            <h3 className="font-display text-xl font-bold text-ink">{t('otpTitle')}</h3>
            <p className="text-sm text-ink-muted">{t('otpSent', { phone })}</p>
            <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder={t('otpPlaceholder')} className="text-center font-display text-2xl tracking-[0.5em]" aria-label={t('otpTitle')} {...codeForm.register('code')} />
            {catalog?.devOtpHint ? <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs font-semibold text-warning">{t('devHint', { code: catalog.devOtpHint })}</p> : null}
            <FieldError message={serverError ?? undefined} />
            <Button type="submit" size="lg" loading={verifying}>{t('verify')}</Button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" className="font-semibold text-primary-strong disabled:text-ink-subtle" disabled={secondsLeft > 0 || requesting} onClick={() => void sendOtp({ phone })}>
                {secondsLeft > 0 ? t('resendIn', { seconds: secondsLeft }) : t('resend')}
              </button>
              <button type="button" className="text-ink-muted" onClick={() => { setPhone(null); setServerError(null); }}>{t('changePhone')}</button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-center text-xs text-ink-subtle">{t('socialDivider')}</p>
          {PROVIDERS.filter((p) => p !== 'apple' || catalog?.authProviders.apple).map((p) => {
            const on = catalog?.authProviders[p] === true;
            const cls = cn('flex h-12 items-center justify-center gap-3 rounded-full text-sm font-bold transition active:scale-[0.98]', p === 'facebook' ? 'bg-brand-facebook text-on-primary hover:brightness-110' : 'border border-border bg-surface text-ink shadow-card hover:bg-surface-muted');
            const inner = <><ProviderIcon provider={p} />{t(p)}</>;
            return on ? (
              <a key={p} href={`/api/v1/auth/oauth/${p}/start?returnTo=${encodeURIComponent(returnTo)}`} className={cls}>{inner}</a>
            ) : (
              <button key={p} type="button" className={cls} onClick={() => toast(t('providerOff', { name: p === 'google' ? 'Google' : p === 'facebook' ? 'Facebook' : 'Apple' }))}>{inner}</button>
            );
          })}
        </div>
        <p className="text-center text-xs text-ink-subtle">{t('privacy')}</p>
      </div>
    </Sheet>
  );
}
