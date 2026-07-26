import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-sage text-white hover:bg-sage-deep border-transparent',
  ghost: 'bg-transparent text-ink-soft border-line-strong hover:bg-sage-tint hover:text-sage-deep',
  danger: 'bg-transparent text-plum-deep border-line-strong hover:bg-plum-tint',
};

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3.5 py-[7px]
        font-mono text-xs whitespace-nowrap transition-colors cursor-pointer
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage
        disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

/** Botón cuadrado de 26px para acciones por fila (editar, eliminar). */
export function IconButton({
  label,
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={`flex size-[26px] shrink-0 items-center justify-center rounded-md border
        border-line-strong bg-surface text-[13px] leading-none text-ink-soft transition-colors
        cursor-pointer hover:bg-sage-tint hover:text-sage-deep
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage ${className}`}
      {...props}
    />
  );
}
