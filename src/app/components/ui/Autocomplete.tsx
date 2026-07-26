'use client';

import { useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { filtrarSugerencias } from '@/lib/sugerencias';

const MAX_SUGERENCIAS = 6;

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  onChange: (valor: string) => void;
  options: string[];
};

/**
 * Campo de texto libre con sugerencias tomadas de lo que el usuario ya cargó.
 * No restringe: se puede escribir cualquier cosa, las opciones solo ahorran
 * tecleo y mantienen la escritura consistente entre productos de la misma marca.
 *
 * Sigue el patrón ARIA de combobox porque un desplegable que solo responde al
 * ratón deja fuera a quien navega con teclado.
 */
export function Autocomplete({ value, onChange, options, className = '', ...props }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const idLista = useId();

  const sugerencias = filtrarSugerencias(options, value, MAX_SUGERENCIAS);
  const visible = abierto && sugerencias.length > 0;

  function elegir(opcion: string) {
    onChange(opcion);
    setAbierto(false);
    setActivo(-1);
  }

  function alTeclear(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!visible) {
      if (e.key === 'ArrowDown') setAbierto(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo((i) => (i + 1) % sugerencias.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => (i <= 0 ? sugerencias.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activo >= 0) {
      // Solo intercepta el Enter si hay una opción resaltada; si no, deja que
      // el formulario se envíe como siempre.
      e.preventDefault();
      elegir(sugerencias[activo]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
      setActivo(-1);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        {...props}
        role="combobox"
        aria-expanded={visible}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={activo >= 0 ? `${idLista}-${activo}` : undefined}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setAbierto(true);
          setActivo(-1);
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onKeyDown={alTeclear}
        className="w-full rounded-md border border-line-strong bg-white px-2.5 py-[7px] text-[13px] text-ink
          placeholder:text-ink-soft/70 outline-none transition-colors
          focus:border-sage focus:ring-2 focus:ring-sage/25"
      />

      {visible && (
        <ul
          id={idLista}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-line-strong bg-surface py-1 shadow-sm"
        >
          {sugerencias.map((o, i) => (
            <li
              key={o}
              id={`${idLista}-${i}`}
              role="option"
              aria-selected={i === activo}
              // preventDefault en mousedown evita que el input pierda el foco
              // antes de que el clic llegue: sin esto, onBlur cierra la lista
              // y el clic nunca se registra.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => elegir(o)}
              onMouseEnter={() => setActivo(i)}
              className={`cursor-pointer px-2.5 py-1.5 text-[13px] transition-colors ${
                i === activo ? 'bg-sage-tint text-sage-deep' : 'text-ink'
              }`}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
