import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

// El preflight de Tailwind deja los controles sin borde, padding ni fondo.
// Esta base los devuelve a algo usable, alineado con .form-box del diseño original.
const base =
  'w-full rounded-md border border-line-strong bg-white px-2.5 py-[7px] text-[13px] text-ink ' +
  'placeholder:text-ink-soft/70 outline-none transition-colors ' +
  'focus:border-sage focus:ring-2 focus:ring-sage/25 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${base} ${className}`} {...props} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${base} appearance-none pr-8 ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${base} min-h-10 resize-y ${className}`} {...props} />;
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft"
    >
      {children}
    </label>
  );
}
