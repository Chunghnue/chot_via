'use client';

import { parseApiError, useGetCatalogQuery, useRequestOtpMutation, useVerifyOtpMutation } from '@chot-via/api-client';
import { Button, FieldError, Input, Label, Notice, OAuthButtons, Sheet, toast, useCodeMessage } from '@chot-via/ui';
import { OtpRequestBodySchema, OtpVerifyBodySchema, type OtpRequestBody, type OtpVerifyBody } from '@chot-via/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'use-intl';
import { track } from '@/lib/analytics';
import { useTurnstile } from '@/components/turnstile';
import { loginDismissed, selectLogin } from '@/features/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const PROVIDERS = ['google', 'facebook', 'apple'] as const;

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
              <Input
                id="login-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t('phonePlaceholder')}
                aria-invalid={!!phoneForm.formState.errors.phone}
                {...phoneForm.register('phone')}
              />
              <FieldError message={phoneForm.formState.errors.phone ? message('AUTH_INVALID_PHONE') : undefined} />
            </div>
            <div ref={turnstile.containerRef} />
            <FieldError message={serverError ?? undefined} />
            <Button type="submit" size="lg" loading={requesting} disabled={!turnstile.ready}>
              {t('sendOtp')}
            </Button>
          </form>
        ) : (
          <form onSubmit={codeForm.handleSubmit(verify)} className="flex flex-col gap-3" noValidate>
            <h3 className="font-display text-xl font-bold text-ink">{t('otpTitle')}</h3>
            <p className="text-sm text-ink-muted">{t('otpSent', { phone })}</p>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder={t('otpPlaceholder')}
              className="text-center font-display text-2xl tracking-[0.5em]"
              aria-label={t('otpTitle')}
              {...codeForm.register('code')}
            />
            {catalog?.devOtpHint ? <Notice>{t('devHint', { code: catalog.devOtpHint })}</Notice> : null}
            <FieldError message={serverError ?? undefined} />
            <Button type="submit" size="lg" loading={verifying}>
              {t('verify')}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="font-semibold text-primary-strong disabled:text-ink-subtle"
                disabled={secondsLeft > 0 || requesting}
                onClick={() => void sendOtp({ phone })}
              >
                {secondsLeft > 0 ? t('resendIn', { seconds: secondsLeft }) : t('resend')}
              </button>
              <button
                type="button"
                className="text-ink-muted"
                onClick={() => {
                  setPhone(null);
                  setServerError(null);
                }}
              >
                {t('changePhone')}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-center text-xs text-ink-subtle">{t('socialDivider')}</p>
          <OAuthButtons
            providers={PROVIDERS.filter((p) => p !== 'apple' || catalog?.authProviders.apple)}
            enabled={catalog?.authProviders}
            hrefFor={(p) => `/api/v1/auth/oauth/${p}/start?returnTo=${encodeURIComponent(returnTo)}`}
            label={(p) => (p === 'google' ? t('google') : p === 'facebook' ? t('facebook') : t('apple'))}
            onUnavailable={(p) => toast(t('providerOff', { name: p === 'google' ? 'Google' : p === 'facebook' ? 'Facebook' : 'Apple' }))}
          />
        </div>
        <p className="text-center text-xs text-ink-subtle">{t('privacy')}</p>
      </div>
    </Sheet>
  );
}
