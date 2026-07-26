'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Droplet, Salad, Dumbbell, NotebookPen } from 'lucide-react';

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
    <Link href="/" className={`font-serif text-[26px] tracking-[0.2px] ${className}`}>
      <span className="font-semibold text-sage">lo</span>
      <span className="font-light italic text-clay">zana</span>
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
      </aside>

      {/* Mobile: barra inferior fija. pb-safe evita que la home indicator de iOS la tape. */}
      <nav
        style={{ viewTransitionName: 'lz-nav-inferior' }}
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
                active ? 'text-sage-deep' : 'text-ink-soft'
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              <span className="font-mono text-[10px] leading-none">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
