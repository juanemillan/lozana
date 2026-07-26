/**
 * Marcador de posición con la forma del contenido real. Frente a un "Cargando..."
 * suelto tiene dos ventajas: el diseño no salta cuando llegan los datos, y la
 * espera se percibe más corta porque ya se ve la estructura de lo que viene.
 *
 * Dos capas a propósito: la de fuera retrasa la aparición (si los datos llegan
 * rápido nunca se ve), la de dentro late. Separarlas evita que las dos
 * animaciones se peleen por la misma propiedad.
 */
export function Skeleton({ filas = 3 }: { filas?: number }) {
  return (
    <div className="anim-esqueleto" aria-hidden>
      <div className="anim-latido">
        <div className="mt-6 mb-2.5 h-5 w-32 rounded bg-line" />

        {Array.from({ length: filas }).map((_, i) => (
          <div key={i} className="mb-2 rounded-[10px] border border-line bg-surface px-3.5 py-3">
            <div className="h-3.5 w-2/5 rounded bg-line" />
            <div className="mt-2 h-3 w-3/5 rounded bg-line/70" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Versión para la cuadrícula de métricas del Resumen. */
export function SkeletonMetricas() {
  return (
    <div className="anim-esqueleto" aria-hidden>
      <div className="anim-latido mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[10px] border border-line bg-surface px-4 py-3.5">
            <div className="h-7 w-10 rounded bg-line" />
            <div className="mt-2 h-3 w-4/5 rounded bg-line/70" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Texto accesible que acompaña a los esqueletos. Los marcadores llevan
 * aria-hidden porque para un lector de pantalla son ruido; esto es lo que
 * anuncia el estado real.
 */
export function CargandoTexto({ children = 'Cargando' }: { children?: string }) {
  return (
    <span role="status" className="sr-only">
      {children}
    </span>
  );
}
