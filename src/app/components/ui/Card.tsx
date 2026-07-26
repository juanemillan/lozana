/**
 * Fila de tarjeta del diseño original: info a la izquierda, acciones a la derecha.
 * `actions` se mantiene fuera del flujo del texto para que no se corte en mobile.
 */
export function Card({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    // La animación de entrada la aplica el contenedor .anim-lista, que además
    // escalona los retrasos. Ponerla también aquí reiniciaría esos retrasos,
    // porque la forma abreviada `animation` resetea animation-delay.
    <div className="mb-2 flex items-start justify-between gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 py-3 transition-colors hover:border-line-strong">
      <div className="min-w-0 flex-1">{children}</div>
      {actions && <div className="flex shrink-0 gap-1.5">{actions}</div>}
    </div>
  );
}

export function CardName({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium">{children}</span>;
}

export function CardMeta({ children }: { children: React.ReactNode }) {
  return <div className="mt-0.5 text-xs text-ink-soft">{children}</div>;
}

export function CardNotes({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-xs italic text-ink-soft">{children}</div>;
}
