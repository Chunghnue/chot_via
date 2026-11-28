import { Injectable } from '@nestjs/common';
import { SignJWT, createRemoteJWKSet, importPKCS8, jwtVerify } from 'jose';
import { z } from 'zod';
import type { OAuthProvider } from '@xin-via/shared';
import { DomainError } from '../../common/domain-error';
import { env } from '../../config/env';

const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

export interface OAuthProfile { providerUserId: string; name: string; avatarUrl: string | null }

const TokenResponse = z.object({ id_token: z.string().optional(), access_token: z.string().optional() });
const FacebookProfile = z.object({ id: z.string(), name: z.string().optional(), picture: z.object({ data: z.object({ url: z.string() }) }).optional() });
const AppleUserField = z.object({ name: z.object({ firstName: z.string().optional(), lastName: z.string().optional() }).optional() });

@Injectable()
export class OAuthService {
  isEnabled(provider: OAuthProvider): boolean {
    if (provider === 'google') return !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET;
    if (provider === 'facebook') return !!env.FACEBOOK_APP_ID && !!env.FACEBOOK_APP_SECRET;
    return !!env.APPLE_CLIENT_ID && !!env.APPLE_TEAM_ID && !!env.APPLE_KEY_ID && !!env.APPLE_PRIVATE_KEY;
  }

  redirectUri(provider: OAuthProvider): string {
    return `${env.PUBLIC_API_URL}/api/v1/auth/oauth/${provider}/callback`;
  }

  /** returnTo chỉ được là đường dẫn nội bộ để tránh chuyển hướng ra ngoài. */
  safeReturnTo(value: string | undefined): string {
    return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
  }

  signState(provider: OAuthProvider, returnTo: string, app: 'web' | 'admin' = 'web'): Promise<string> {
    return new SignJWT({ provider, returnTo, app }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('10m').sign(secret);
  }

  async readState(state: string | undefined, provider: OAuthProvider): Promise<{ returnTo: string; app: 'web' | 'admin' }> {
    try {
      if (!state) throw new Error('no state');
      const { payload } = await jwtVerify(state, secret, { algorithms: ['HS256'] });
      if (payload['provider'] !== provider || typeof payload['returnTo'] !== 'string') throw new Error('bad state');
      return { returnTo: this.safeReturnTo(payload['returnTo']), app: payload['app'] === 'admin' ? 'admin' : 'web' };
    } catch {
      throw new DomainError('AUTH_PROVIDER_FAILED');
    }
  }

  async authorizeUrl(provider: OAuthProvider, state: string): Promise<string> {
    if (!this.isEnabled(provider)) throw new DomainError('AUTH_PROVIDER_NOT_CONFIGURED');
    const redirect = this.redirectUri(provider);
    if (provider === 'google') {
      const q = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirect, response_type: 'code', scope: 'openid profile', state, prompt: 'select_account' });
      return `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`;
    }
    if (provider === 'facebook') {
      const q = new URLSearchParams({ client_id: env.FACEBOOK_APP_ID, redirect_uri: redirect, response_type: 'code', scope: 'public_profile', state });
      return `https://www.facebook.com/v19.0/dialog/oauth?${q.toString()}`;
    }
    const q = new URLSearchParams({ client_id: env.APPLE_CLIENT_ID, redirect_uri: redirect, response_type: 'code', response_mode: 'form_post', scope: 'name', state });
    return `https://appleid.apple.com/auth/authorize?${q.toString()}`;
  }

  async exchange(provider: OAuthProvider, code: string, appleUser?: string): Promise<OAuthProfile> {
    if (!this.isEnabled(provider)) throw new DomainError('AUTH_PROVIDER_NOT_CONFIGURED');
    try {
      if (provider === 'google') return await this.google(code);
      if (provider === 'facebook') return await this.facebook(code);
      return await this.apple(code, appleUser);
    } catch (error) {
      throw error instanceof DomainError ? error : new DomainError('AUTH_PROVIDER_FAILED');
    }
  }

  private async post(url: string, form: Record<string, string>): Promise<z.infer<typeof TokenResponse>> {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(form) });
    if (!res.ok) throw new DomainError('AUTH_PROVIDER_FAILED');
    return TokenResponse.parse(await res.json());
  }

  private async google(code: string): Promise<OAuthProfile> {
    const token = await this.post('https://oauth2.googleapis.com/token', {
      code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: this.redirectUri('google'), grant_type: 'authorization_code',
    });
    if (!token.id_token) throw new DomainError('AUTH_PROVIDER_FAILED');
    const { payload } = await jwtVerify(token.id_token, googleJwks, { issuer: ['https://accounts.google.com', 'accounts.google.com'], audience: env.GOOGLE_CLIENT_ID });
    const name = typeof payload['name'] === 'string' ? payload['name'] : '';
    const picture = typeof payload['picture'] === 'string' ? payload['picture'] : null;
    return { providerUserId: payload.sub ?? '', name, avatarUrl: picture };
  }

  private async facebook(code: string): Promise<OAuthProfile> {
    const q = new URLSearchParams({ client_id: env.FACEBOOK_APP_ID, client_secret: env.FACEBOOK_APP_SECRET, redirect_uri: this.redirectUri('facebook'), code });
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${q.toString()}`);
    const token = TokenResponse.parse(await tokenRes.json());
    if (!token.access_token) throw new DomainError('AUTH_PROVIDER_FAILED');
    const meRes = await fetch(`https://graph.facebook.com/me?fields=id,name,picture.type(large)&access_token=${encodeURIComponent(token.access_token)}`);
    const me = FacebookProfile.parse(await meRes.json());
    return { providerUserId: me.id, name: me.name ?? '', avatarUrl: me.picture?.data.url ?? null };
  }

  private async apple(code: string, userField: string | undefined): Promise<OAuthProfile> {
    const key = await importPKCS8(env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'), 'ES256');
    const clientSecret = await new SignJWT({}).setProtectedHeader({ alg: 'ES256', kid: env.APPLE_KEY_ID })
      .setIssuer(env.APPLE_TEAM_ID).setAudience('https://appleid.apple.com').setSubject(env.APPLE_CLIENT_ID).setIssuedAt().setExpirationTime('5m').sign(key);
    const token = await this.post('https://appleid.apple.com/auth/token', {
      code, client_id: env.APPLE_CLIENT_ID, client_secret: clientSecret, redirect_uri: this.redirectUri('apple'), grant_type: 'authorization_code',
    });
    if (!token.id_token) throw new DomainError('AUTH_PROVIDER_FAILED');
    const { payload } = await jwtVerify(token.id_token, appleJwks, { issuer: 'https://appleid.apple.com', audience: env.APPLE_CLIENT_ID });
    let name = '';
    if (userField) {
      const parsed = AppleUserField.safeParse(JSON.parse(userField));
      if (parsed.success) name = [parsed.data.name?.firstName, parsed.data.name?.lastName].filter(Boolean).join(' ');
    }
    return { providerUserId: payload.sub ?? '', name, avatarUrl: null };
  }
}
