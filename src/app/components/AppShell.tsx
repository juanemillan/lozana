'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { LoginForm } from './LoginForm';
import { Onboarding, SKIP_KEY } from './Onboarding';
import { Nav, Wordmark } from './Nav';
import { DateStamp } from './DateStamp';
import { Avatar } from './ui/Avatar';
import { initials } from '@/lib/profile';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const [skipped, setSkipped] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-xs text-ink-soft">Cargando...</p>
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
        <div className="mx-auto max-w-[920px] px-5 pt-7 pb-24 md:pb-14">
          <header className="mb-5 flex items-baseline justify-between gap-3 border-b-2 border-ink pb-3.5">
            <Wordmark className="md:hidden" />
            <h1 className="hidden text-[26px] md:block">Bitácora de piel</h1>

            <div className="flex shrink-0 items-center gap-2 self-center">
              <DateStamp />
              <Link
                href="/perfil"
                aria-label="Perfil"
                aria-current={pathname === '/perfil' ? 'page' : undefined}
                className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
              >
                <Avatar
                  path={profile?.avatar_path ?? null}
                  fallback={initials(profile, user.email)}
                />
              </Link>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </>
  );
}
