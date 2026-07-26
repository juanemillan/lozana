'use client';

import { useSyncExternalStore } from 'react';

const NEVER_CHANGES = () => () => {};

const clientDate = () =>
  new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });

// En el servidor devuelve '—': la fecha local del servidor y la del navegador pueden
// caer en días distintos, y renderizar la del servidor rompería la hidratación.
const serverDate = () => '—';

export function DateStamp() {
  const today = useSyncExternalStore(NEVER_CHANGES, clientDate, serverDate);

  return (
    <span className="rounded-[3px] border border-line-strong px-2 py-[3px] font-mono text-[11px] text-ink-soft tabular-nums">
      {today}
    </span>
  );
}
