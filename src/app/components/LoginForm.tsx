'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Wordmark } from './Nav';
import { Input, Label } from './ui/Field';
import { Button } from './ui/Button';
import { LanguageSelector } from './LanguageSelector';
import { useI18n } from '@/i18n/I18nProvider';

type Mode = 'login' | 'signup';

function traducir(mensaje: string, t: (key: string) => string) {
  if (mensaje === 'Invalid login credentials') return t('auth.invalid');
  if (/already registered/i.test(mensaje)) return t('auth.registered');
  if (/signups not allowed/i.test(mensaje))
    return t('auth.closed');
  if (/password should be at least/i.test(mensaje))
    return t('auth.shortPassword');
  if (/email not confirmed/i.test(mensaje))
    return t('auth.unconfirmed');
  return mensaje;
}

export function LoginForm() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setAviso(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setAviso(null);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      // Si sale bien no toco el estado: onAuthStateChange desmonta este form.
      if (error) {
        setError(traducir(error.message, t));
        setBusy(false);
      }
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(traducir(error.message, t));
      setBusy(false);
      return;
    }

    // Con "Confirm email" activo y el mail ya registrado, Supabase responde OK
    // pero sin identities, para no delatar qué direcciones existen.
    if (data.user && data.user.identities?.length === 0) {
      setError(t('auth.registered'));
      setMode('login');
      setBusy(false);
      return;
    }

    if (!data.session) {
      setAviso(t('auth.created'));
      setMode('login');
      setBusy(false);
    }
    // Si vino sesión (confirmación desactivada), onAuthStateChange se encarga.
  }

  const esRegistro = mode === 'signup';

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form
        onSubmit={handleSubmit}
        className="anim-subir w-full max-w-80 rounded-[10px] border border-line bg-surface p-6"
      >
        <div className="mb-1 flex items-center justify-between gap-3">
          <Wordmark />
          <LanguageSelector />
        </div>
        <p className="mb-5 text-[13px] text-ink-soft">
          {esRegistro ? t('auth.createAccount') : t('app.subtitle')}
        </p>

        <div className="mb-3">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            autoFocus
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={esRegistro ? 'new-password' : 'current-password'}
            minLength={esRegistro ? 6 : undefined}
            required
          />
          {esRegistro && <p className="mt-1 text-[11px] text-ink-soft">{t('auth.passwordHint')}</p>}
        </div>

        {error && (
          <p role="alert" className="mb-3 text-xs text-plum-deep">
            {error}
          </p>
        )}

        {aviso && (
          <p role="status" className="mb-3 text-xs text-sage-deep">
            {aviso}
          </p>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy
            ? esRegistro
              ? t('auth.creating')
              : t('auth.entering')
            : esRegistro
              ? t('auth.signUp')
              : t('auth.signIn')}
        </Button>

        <p className="mt-4 text-center text-xs text-ink-soft">
          {esRegistro ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
          <button
            type="button"
            onClick={() => switchMode(esRegistro ? 'login' : 'signup')}
            className="cursor-pointer text-sage-deep underline underline-offset-2 hover:text-sage"
          >
            {esRegistro ? t('auth.signIn') : t('auth.signUp')}
          </button>
        </p>
      </form>
    </div>
  );
}
