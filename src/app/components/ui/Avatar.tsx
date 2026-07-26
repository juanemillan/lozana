'use client';

import { useSignedUrl } from '@/lib/useSignedUrl';

/** Cae en las iniciales mientras no haya foto (o si falla la firma). */
export function Avatar({
  path,
  fallback,
  size = 32,
}: {
  path: string | null;
  fallback: string;
  size?: number;
}) {
  const url = useSignedUrl(path);

  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-sage-tint"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL firmada que vence; next/image la re-optimizaría por nada
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <span
          className="font-mono text-sage-deep"
          style={{ fontSize: Math.round(size * 0.36) }}
          aria-hidden
        >
          {fallback}
        </span>
      )}
    </span>
  );
}

/** Miniatura cuadrada para las tarjetas de producto. */
export function Thumb({
  path,
  alt,
  className = 'mt-2 block size-14',
  placeholder = false,
  fallback = alt,
}: {
  path: string | null;
  alt: string;
  className?: string;
  placeholder?: boolean;
  fallback?: string;
}) {
  const url = useSignedUrl(path);
  if (!path && !placeholder) return null;

  return (
    <span
      className={`${className} shrink-0 overflow-hidden rounded-md border border-line bg-paper`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- ídem Avatar
        <img src={url} alt={alt} className="size-full object-cover" />
      ) : (
        <span
          className="flex size-full items-center justify-center font-serif text-lg text-ink-soft/45"
          aria-hidden
        >
          {fallback.trim().charAt(0).toUpperCase() || '·'}
        </span>
      )}
    </span>
  );
}
