'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { AGE_RANGES, CONCERNS, SKIN_TYPES, EMPTY_DRAFT, type ProfileDraft } from '@/lib/profile';
import { Wordmark } from './Nav';
import { Input, Label, Textarea } from './ui/Field';
import { Button } from './ui/Button';
import { ChipSelect, ChipMultiSelect } from './ui/Chips';

export const SKIP_KEY = 'lozana:onboarding-skipped';

const PASOS = [
  { titulo: 'Empecemos por vos', sub: 'Para saber cómo llamarte.' },
  { titulo: 'Tu piel', sub: 'Lo que más define qué te sirve y qué no.' },
  { titulo: 'Qué cuidar', sub: 'Opcional, pero es lo que más ayuda después.' },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { user, refreshProfile } = useAuth();
  const [paso, setPaso] = useState(0);
  const [avanzando, setAvanzando] = useState(true);
  const [draft, setDraft] = useState<ProfileDraft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // La dirección del movimiento indica si se avanza o se retrocede. Sin esa
  // señal, ir y volver entre pasos se ve idéntico y desorienta.
  function irA(siguiente: number) {
    setAvanzando(siguiente > paso);
    setPaso(siguiente);
  }

  function set<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function skip() {
    localStorage.setItem(SKIP_KEY, '1');
    onDone();
  }

  async function guardar() {
    if (!user) return;
    setBusy(true);
    setError(null);

    const { error } = await supabase
      .from('users')
      .update({
        ...draft,
        full_name: draft.full_name?.trim() || null,
        sensitivities: draft.sensitivities?.trim() || null,
        goal: draft.goal?.trim() || null,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    localStorage.removeItem(SKIP_KEY);
    await refreshProfile();
    onDone();
  }

  const ultimo = paso === PASOS.length - 1;

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="anim-subir w-full max-w-md rounded-[10px] border border-line bg-surface p-6">
        <Wordmark className="mb-5 block" />

        {/* Progreso */}
        <div className="mb-5 flex gap-1.5">
          {PASOS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-[400ms] ease-suave ${
                i <= paso ? 'bg-sage' : 'bg-line'
              }`}
            />
          ))}
        </div>

        {/* key={paso} remonta el bloque, que es lo que vuelve a disparar la
            animación. min-h evita que la tarjeta salte de alto entre pasos. */}
        <div
          key={paso}
          className={`min-h-64 ${avanzando ? 'anim-entrar-derecha' : 'anim-entrar-izquierda'}`}
        >
          <h2 className="text-xl">{PASOS[paso].titulo}</h2>
          <p className="mt-1 mb-5 text-[13px] text-ink-soft">{PASOS[paso].sub}</p>

          {paso === 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="nombre">¿Cómo te llamás?</Label>
              <Input
                id="nombre"
                value={draft.full_name ?? ''}
                onChange={(e) => set('full_name', e.target.value)}
                placeholder="Tu nombre"
                autoFocus
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
          </div>
        )}

        {paso === 1 && (
          <div className="flex flex-col gap-4">
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
              <Label>¿Qué te preocupa? Podés elegir varias</Label>
              <ChipMultiSelect
                label="Preocupaciones"
                options={CONCERNS}
                value={draft.concerns}
                onChange={(v) => set('concerns', v)}
              />
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="sens">Alergias o ingredientes que te irritan</Label>
              <Textarea
                id="sens"
                value={draft.sensitivities ?? ''}
                onChange={(e) => set('sensitivities', e.target.value)}
                placeholder="Ej: fragancia, alcohol denat., ácido salicílico..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="obj">¿Qué te gustaría lograr?</Label>
              <Textarea
                id="obj"
                value={draft.goal ?? ''}
                onChange={(e) => set('goal', e.target.value)}
                placeholder="Ej: emparejar el tono y que la piel se vea más firme"
                rows={2}
              />
            </div>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-xs text-plum-deep">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={skip}
            className="cursor-pointer font-mono text-[11px] text-ink-soft underline underline-offset-2 hover:text-ink"
          >
            Después
          </button>

          <div className="flex gap-2">
            {paso > 0 && (
              <Button variant="ghost" onClick={() => irA(paso - 1)}>
                Atrás
              </Button>
            )}
            {ultimo ? (
              <Button onClick={guardar} disabled={busy}>
                {busy ? 'Guardando...' : 'Listo'}
              </Button>
            ) : (
              <Button onClick={() => irA(paso + 1)}>Siguiente</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
