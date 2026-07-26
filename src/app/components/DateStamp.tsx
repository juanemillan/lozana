'use client';

import { useSyncExternalStore } from 'react';
import { useI18n } from '@/i18n/I18nProvider';

const NEVER_CHANGES = () => () => {};

// En el servidor devuelve '—': la fecha local del servidor y la del navegador pueden
// caer en días distintos, y renderizar la del servidor rompería la hidratación.
const serverDate = () => '—';

export function DateStamp() {
  const { locale } = useI18n();
  const clientDate = () =>
    new Date().toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  const today = useSyncExternalStore(NEVER_CHANGES, clientDate, serverDate);

  return (
    <span className="rounded-[3px] border border-line-strong px-2 py-[3px] font-mono text-[11px] text-ink-soft tabular-nums">
      {today}
    </span>
  );
}
