'use client';

import { useState } from 'react';
import { LogOut, ImagePlus, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadImage, removeImage } from '@/lib/uploadImage';
import { useAuth } from './AuthProvider';
import {
  AGE_RANGES,
  CONCERNS,
  SKIN_TYPES,
  draftFrom,
  initials,
  type ProfileDraft,
} from '@/lib/profile';
import { SectionTitle } from './ui/SectionTitle';
import { Input, Label, Textarea } from './ui/Field';
import { Button } from './ui/Button';
import { ChipSelect, ChipMultiSelect } from './ui/Chips';
import { Avatar } from './ui/Avatar';
import { useI18n } from '@/i18n/I18nProvider';

export default function Perfil() {
  const { t, label } = useI18n();
  const { user, profile, refreshProfile } = useAuth();
  const [draft, setDraft] = useState<ProfileDraft>(() => draftFrom(profile));
  const [busy, setBusy] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setAviso(null);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    setAviso(null);

    const { error } = await supabase
      .from('users')
      .update({
        ...draft,
        full_name: draft.full_name?.trim() || null,
        sensitivities: draft.sensitivities?.trim() || null,
        goal: draft.goal?.trim() || null,
        // Completar el perfil desde acá también cierra el onboarding pendiente.
        onboarding_completed_at: profile?.onboarding_completed_at ?? new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) setError(error.message);
    else {
      await refreshProfile();
      setAviso(t('profile.saved'));
    }
    setBusy(false);
  }

  function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Se limpia el input para que volver a elegir el mismo archivo dispare el evento.
    e.target.value = '';
    if (file) cambiarFoto(file);
  }

  async function cambiarFoto(file: File) {
    if (!user) return;
    setSubiendo(true);
    setError(null);

    const anterior = profile?.avatar_path ?? null;
    const path = await uploadImage(file, user.id, 'avatar');

    if (!path) {
      setError(t('profile.uploadError'));
      setSubiendo(false);
      return;
    }

    const { error } = await supabase.from('users').update({ avatar_path: path }).eq('id', user.id);

    if (error) setError(error.message);
    else {
      if (anterior) await removeImage(anterior);
      await refreshProfile();
    }
    setSubiendo(false);
  }

  if (!user) return null;

  return (
    // anim-lista escalona los tres bloques: título, identidad y formulario.
    <div className="anim-lista">
      <SectionTitle
        action={
          <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
            <LogOut size={13} strokeWidth={1.75} aria-hidden />
            {t('profile.signOut')}
          </Button>
        }
      >
        {t('profile.title')}
      </SectionTitle>

      <div className="mb-5 flex items-center gap-3.5 rounded-[10px] border border-line bg-surface p-3.5">
        <Avatar path={profile?.avatar_path ?? null} fallback={initials(profile, user.email)} size={56} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{profile?.full_name || t('profile.noName')}</p>
          <p className="truncate text-xs text-ink-soft">{user.email}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {subiendo ? (
              <span className="font-mono text-[11px] text-ink-soft">{t('profile.uploading')}</span>
            ) : (
              <>
                <label className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-ink-soft transition-colors hover:text-sage-deep">
                  <ImagePlus size={13} strokeWidth={1.75} aria-hidden />
                  {profile?.avatar_path ? t('profile.changePhoto') : t('profile.uploadPhoto')}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={elegirArchivo}
                  />
                </label>

                {/* capture abre directamente la cámara frontal en móvil.
                    En escritorio el atributo se ignora y abriría el mismo
                    selector de archivos que el botón de al lado, así que ahí
                    se oculta: una etiqueta que promete cámara y da un
                    explorador de archivos confunde más de lo que ayuda. */}
                <label className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-ink-soft transition-colors hover:text-sage-deep md:hidden">
                  <Camera size={13} strokeWidth={1.75} aria-hidden />
                  {t('profile.takePhoto')}
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="sr-only"
                    onChange={elegirArchivo}
                  />
                </label>
              </>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={guardar} className="rounded-[10px] border border-line bg-surface p-3.5">
        <p className="mb-4 text-xs text-ink-soft">
          {t('profile.context')}
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="nombre">{t('profile.name')}</Label>
            <Input
              id="nombre"
              value={draft.full_name ?? ''}
              onChange={(e) => set('full_name', e.target.value)}
              placeholder={t('onboarding.yourName')}
            />
          </div>

          <div>
            <Label>{t('profile.ageRange')}</Label>
            <ChipSelect
              label={t('profile.ageRange')}
              options={AGE_RANGES}
              value={draft.age_range}
              onChange={(v) => set('age_range', v)}
            />
          </div>

          <div>
            <Label>{t('profile.skinType')}</Label>
            <ChipSelect
              label={t('profile.skinType')}
              options={SKIN_TYPES}
              value={draft.skin_type}
              onChange={(v) => set('skin_type', v)}
              getOptionLabel={label}
            />
          </div>

          <div>
            <Label>{t('profile.concerns')}</Label>
            <ChipMultiSelect
              label={t('profile.concerns')}
              options={CONCERNS}
              value={draft.concerns}
              onChange={(v) => set('concerns', v)}
              getOptionLabel={label}
            />
          </div>

          <div>
            <Label htmlFor="sens">{t('profile.sensitivities')}</Label>
            <Textarea
              id="sens"
              value={draft.sensitivities ?? ''}
              onChange={(e) => set('sensitivities', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="obj">{t('profile.goal')}</Label>
            <Textarea
              id="obj"
              value={draft.goal ?? ''}
              onChange={(e) => set('goal', e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-xs text-plum-deep">
            {error}
          </p>
        )}
        {aviso && (
          <p role="status" className="mt-4 text-xs text-sage-deep">
            {aviso}
          </p>
        )}

        <div className="mt-5 flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
