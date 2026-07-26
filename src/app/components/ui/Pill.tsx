'use client';

import { useI18n } from '@/i18n/I18nProvider';

type Tone = 'sage' | 'sand' | 'clay' | 'plum';

const tones: Record<Tone, string> = {
  sage: 'bg-sage-tint text-sage-deep',
  sand: 'bg-sand text-sand-deep',
  clay: 'bg-clay-tint text-clay-deep',
  plum: 'bg-plum-tint text-plum-deep',
};

export function Pill({ children, tone = 'sage' }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-[10px] px-2 py-1
        font-mono text-[10px] leading-none tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** AM va en verde, PM en arena. 'AM/PM' rinde las dos. */
export function TimePill({ time }: { time: string }) {
  if (time === 'AM') return <Pill tone="sage">AM</Pill>;
  if (time === 'PM') return <Pill tone="sand">PM</Pill>;
  return (
    <>
      <Pill tone="sage">AM</Pill>
      <Pill tone="sand">PM</Pill>
    </>
  );
}

const statusTones: Record<string, Tone> = {
  Activo: 'sage',
  Pendiente: 'clay',
  Pausado: 'plum',
};

export function StatusPill({ status }: { status: string }) {
  const { label } = useI18n();
  return <Pill tone={statusTones[status] ?? 'sand'}>{label(status)}</Pill>;
}
