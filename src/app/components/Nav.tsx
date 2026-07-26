'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Droplet, Salad, Dumbbell, NotebookPen } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { Avatar } from './ui/Avatar';
import { initials } from '@/lib/profile';

const items = [
  { href: '/', label: 'Hoy', icon: Sun },
  { href: '/productos', label: 'Productos', icon: Droplet },
  { href: '/alimentacion', label: 'Alimentación', icon: Salad },
  { href: '/ejercicio', label: 'Ejercicio', icon: Dumbbell },
  { href: '/bitacora', label: 'Bitácora', icon: NotebookPen },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-serif text-[26px] tracking-[0.2px] ${className}`}
    >
      <Image
        src="/lozana-icon.svg"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0"
        unoptimized
      />
      <span>
        <span className="font-semibold text-sage">lo</span>
        <span className="font-light italic text-clay">zana</span>
      </span>
    </Link>
  );
}

/** Bloque de identidad al pie de la sidebar: avatar, nombre y correo. */
function PerfilSidebar({ activo }: { activo: boolean }) {
  const { user, profile } = useAuth();
  if (!user) return null;

  return (
    <Link
      href="/perfil"
      aria-current={activo ? 'page' : undefined}
      className={`mt-auto flex items-center gap-2.5 rounded-lg border-t border-line px-2.5 pt-4 pb-1 transition-colors ${
        activo ? 'text-ink' : 'text-ink-soft hover:text-sage-deep'
      }`}
    >
      <Avatar path={profile?.avatar_path ?? null} fallback={initials(profile, user.email)} />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-ink">
          {profile?.full_name || 'Mi perfil'}
        </span>
        <span className="block truncate font-mono text-[10px]">{user.email}</span>
      </span>
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: sidebar fija. El viewTransitionName la ancla durante las
          navegaciones para que no se desplace junto con el contenido. */}
      <aside
        style={{ viewTransitionName: 'lz-nav-lateral' }}
        className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r border-line bg-surface px-4 py-7 md:flex"
      >
        <Wordmark className="mb-8 px-2.5" />

        <nav className="flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-mono text-[13px] transition-colors ${
                  active
                    ? 'bg-ink text-surface'
                    : 'text-ink-soft hover:bg-sage-tint hover:text-sage-deep'
                }`}
              >
                <Icon size={16} strokeWidth={1.75} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* mt-auto lo empuja al pie. El borde superior separa la identidad de
            la navegación: son dos cosas distintas y conviene que se lean así. */}
        <PerfilSidebar activo={pathname === '/perfil'} />
      </aside>

      {/* Mobile: barra inferior fija.
          El padding inferior suma el safe-area-inset a un colchón propio de
          1.1rem. El inset solo cubre la home indicator; el colchón extra es
          para las esquinas redondeadas de la pantalla, que recortan los bordes
          y dejan los iconos exteriores a medio ver. */}
      <nav
        style={{ viewTransitionName: 'lz-nav-inferior' }}
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-line bg-surface pt-4 pb-[calc(env(safe-area-inset-bottom)+1.1rem)] md:hidden"
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1.5 px-1 transition-colors ${
                active ? 'text-sage-deep' : 'text-ink-soft'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              <span className="font-mono text-[11px] leading-none">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
