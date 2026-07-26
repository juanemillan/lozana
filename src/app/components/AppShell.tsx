'use client';

import { useState, ViewTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { LoginForm } from './LoginForm';
import { Onboarding, SKIP_KEY } from './Onboarding';
import { Nav, Wordmark } from './Nav';
import { DateStamp } from './DateStamp';
import { Avatar } from './ui/Avatar';
import { initials } from '@/lib/profile';
import { LanguageSelector } from './LanguageSelector';
import { useI18n } from '@/i18n/I18nProvider';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const [skipped, setSkipped] = useState(false);
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-xs text-ink-soft">{t('common.loading')}...</p>
      </div>
    );
  }

  if (!user) return <LoginForm />;

  // El onboarding aparece una vez. `skipped` cubre el "Después" dentro de esta
  // sesión; SKIP_KEY lo recuerda entre recargas. El recordatorio del Resumen
  // sigue apareciendo mientras el perfil esté incompleto.
  const pendiente = profile !== null && !profile.onboarding_completed_at;
  const posterga = skipped || (typeof window !== 'undefined' && localStorage.getItem(SKIP_KEY));

  if (pendiente && !posterga) {
    return <Onboarding onDone={() => setSkipped(true)} />;
  }

  return (
    <>
      <Nav />

      {/* md:pl-56 deja el espacio de la sidebar; pb-24 el de la barra inferior. */}
      <div className="md:pl-56">
        {/* pb-32 deja hueco para la barra inferior, ahora más alta. */}
        <div className="mx-auto max-w-[920px] px-5 pt-7 pb-32 md:pb-14">
          <header
            style={{ viewTransitionName: 'lz-encabezado' }}
            className="mb-5 flex items-baseline justify-between gap-3 border-b-2 border-ink pb-3.5"
          >
            <Wordmark className="md:hidden" />
            <h1 className="hidden text-[26px] md:block">{t('app.subtitle')}</h1>

            <div className="flex shrink-0 items-center gap-2 self-center">
              <LanguageSelector />
              <DateStamp />
              {/* En escritorio el acceso al perfil vive al pie de la sidebar,
                  así que aquí solo aparece en móvil. */}
              <Link
                href="/perfil"
                aria-label={t('nav.profile')}
                aria-current={pathname === '/perfil' ? 'page' : undefined}
                className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage md:hidden"
              >
                <Avatar
                  path={profile?.avatar_path ?? null}
                  fallback={initials(profile, user.email)}
                />
              </Link>
            </div>
          </header>

          {/* default="none" evita que esta transición se dispare con cambios
              ajenos a la navegación, como abrir un formulario. */}
          <ViewTransition enter="lz-seccion" exit="lz-seccion" default="none">
            <main>{children}</main>
          </ViewTransition>
        </div>
      </div>
    </>
  );
}
