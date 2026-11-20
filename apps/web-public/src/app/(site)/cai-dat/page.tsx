'use client';

import { useLogoutMutation } from '@chot-via/api-client';
import { Button, Card } from '@chot-via/ui';
import { useTranslations } from 'use-intl';
import { ProfileForm } from '@/components/common/profile-form';
import { PageTitle, RequireMember } from '@/components/common/require-member';
import { useCurrentUser } from '@/lib/use-member';

function Settings() {
  const t = useTranslations('profile');
  const tn = useTranslations('nav');
  const me = useCurrentUser();
  const [logout, { isLoading }] = useLogoutMutation();
  if (!me) return null;
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <PageTitle>{t('settingsTitle')}</PageTitle>
      <Card className="p-5">
        {me.phoneMasked ? <p className="mb-4 text-sm text-ink-muted">{t('phone')}: <b>{me.phoneMasked}</b></p> : null}
        <ProfileForm me={me} />
      </Card>
      <Button variant="danger" size="lg" loading={isLoading} onClick={() => void logout()}>{tn('logout')}</Button>
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations('profile');
  return <RequireMember reason="profile" message={t('loginPrompt')}><Settings /></RequireMember>;
}
