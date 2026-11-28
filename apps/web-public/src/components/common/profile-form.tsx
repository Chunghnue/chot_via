'use client';

import { useUpdateMeMutation, useUploadMediaMutation } from '@xin-via/api-client';
import { MEMBER_ROLES, UpdateMeBodySchema, type MeDto, type UpdateMeBody } from '@xin-via/shared';
import { Avatar, Button, FieldError, Input, Label, Select, Textarea, toast, useRoleLabel, useValidationMessage } from '@xin-via/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'use-intl';
import { useApiToast } from '@/lib/use-api-toast';

export function ProfileForm({ me, onSaved }: { me: MeDto; onSaved?: () => void }) {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const roleLabel = useRoleLabel();
  const validation = useValidationMessage();
  const toastApi = useApiToast();
  const [update, { isLoading }] = useUpdateMeMutation();
  const [upload, { isLoading: uploading }] = useUploadMediaMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const form = useForm<UpdateMeBody>({
    resolver: zodResolver(UpdateMeBodySchema),
    defaultValues: { displayName: me.displayName, avatarUrl: me.avatarUrl, memberRole: me.memberRole, province: me.province ?? '', bio: me.bio ?? '' },
  });
  const avatar = form.watch('avatarUrl');

  const submit = form.handleSubmit(async (values) => {
    try {
      await update({ ...values, province: values.province?.trim() || null, bio: values.bio?.trim() || null }).unwrap();
      toast.success(t('saved'));
      onSaved?.();
    } catch (e) { toastApi.error(e); }
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="flex flex-col gap-4" noValidate>
      <div className="flex items-center gap-4">
        <Avatar src={avatar ?? null} name={me.displayName} size={72} />
        <div>
          <Button variant="outline" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>{t('changeAvatar')}</Button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file).unwrap().then((m) => form.setValue('avatarUrl', m.url, { shouldDirty: true })).catch(toastApi.error);
            e.target.value = '';
          }} />
        </div>
      </div>
      <div>
        <Label htmlFor="displayName">{t('displayName')}</Label>
        <Input id="displayName" maxLength={40} {...form.register('displayName')} />
        <FieldError message={form.formState.errors.displayName ? validation('too_small', { min: 2 }) : undefined} />
      </div>
      <div>
        <Label htmlFor="memberRole">{t('role')}</Label>
        <Select id="memberRole" value={form.watch('memberRole') ?? ''} onChange={(e) => form.setValue('memberRole', MEMBER_ROLES.find((r) => r === e.target.value) ?? null)}>
          <option value="">{t('roleNone')}</option>
          {MEMBER_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </Select>
      </div>
      <div><Label htmlFor="province">{t('province')}</Label><Input id="province" maxLength={40} {...form.register('province')} /></div>
      <div><Label htmlFor="bio">{t('bio')}</Label><Textarea id="bio" maxLength={200} className="min-h-24" {...form.register('bio')} /></div>
      <Button type="submit" size="lg" loading={isLoading}>{tc('save')}</Button>
    </form>
  );
}
