'use client';

import { useState } from 'react';
import { LogOut, ImagePlus } from 'lucide-react';
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

export default function Perfil() {
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
      setAviso('Perfil guardado.');
    }
    setBusy(false);
  }

  async function cambiarFoto(file: File) {
    if (!user) return;
    setSubiendo(true);
    setError(null);

    const anterior = profile?.avatar_path ?? null;
    const path = await uploadImage(file, user.id, 'avatar');

    if (!path) {
      setError('No se pudo subir la imagen.');
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
    <div>
      <SectionTitle
        action={
          <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
            <LogOut size={13} strokeWidth={1.75} aria-hidden />
            Salir
          </Button>
        }
      >
        Perfil
      </SectionTitle>

      <div className="mb-5 flex items-center gap-3.5 rounded-[10px] border border-line bg-surface p-3.5">
        <Avatar path={profile?.avatar_path ?? null} fallback={initials(profile, user.email)} size={56} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{profile?.full_name || 'Sin nombre'}</p>
          <p className="truncate text-xs text-ink-soft">{user.email}</p>
          <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-ink-soft hover:text-sage-deep">
            <ImagePlus size={13} strokeWidth={1.75} aria-hidden />
            {subiendo ? 'Subiendo...' : profile?.avatar_path ? 'Cambiar foto' : 'Agregar foto'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={subiendo}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) cambiarFoto(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>

      <form onSubmit={guardar} className="rounded-[10px] border border-line bg-surface p-3.5">
        <p className="mb-4 text-xs text-ink-soft">
          Todo esto es el contexto que va a usar el asistente más adelante. Mientras más completo,
          mejores recomendaciones.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={draft.full_name ?? ''}
              onChange={(e) => set('full_name', e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <Label>Rango de edad</Label>
            <ChipSelect
              label="Rango de edad"
              options={AGE_RANGES}
              value={draft.age_range}
              onChange={(v) => set('age_range', v)}
            />
          </div>

          <div>
            <Label>Tipo de piel</Label>
            <ChipSelect
              label="Tipo de piel"
              options={SKIN_TYPES}
              value={draft.skin_type}
              onChange={(v) => set('skin_type', v)}
            />
          </div>

          <div>
            <Label>Preocupaciones</Label>
            <ChipMultiSelect
              label="Preocupaciones"
              options={CONCERNS}
              value={draft.concerns}
              onChange={(v) => set('concerns', v)}
            />
          </div>

          <div>
            <Label htmlFor="sens">Alergias o ingredientes que te irritan</Label>
            <Textarea
              id="sens"
              value={draft.sensitivities ?? ''}
              onChange={(e) => set('sensitivities', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="obj">Objetivo</Label>
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
            {busy ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
