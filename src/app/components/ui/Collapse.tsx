'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Plegado suave sin conocer la altura del contenido: el truco es animar
 * grid-template-rows de 0fr a 1fr, que sí es interpolable (height: auto no lo es).
 *
 * El contenido queda montado siempre, para poder animar también el cierre. Por
 * eso lleva `inert` cuando está cerrado: sin eso, los campos ocultos seguirían
 * siendo enfocables con el tabulador y visibles para un lector de pantalla.
 */
export function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  const contenido = useRef<HTMLDivElement>(null);
  const abiertoAntes = useRef(open);
  // El recorte solo hace falta mientras la altura está animando. Una vez
  // desplegado del todo se libera, porque si no recorta lo que un hijo quiera
  // dibujar fuera del formulario: en concreto, el desplegable del autocompletado.
  const [terminoDeAbrir, setTerminoDeAbrir] = useState(false);

  useEffect(() => {
    // Al abrir, enfoca el primer campo. Como el nodo no se desmonta, `autoFocus`
    // solo actuaría la primera vez.
    if (open && !abiertoAntes.current) {
      contenido.current?.querySelector<HTMLElement>('input, select, textarea')?.focus();
    }
    abiertoAntes.current = open;
  }, [open]);

  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-[260ms] ease-suave ${
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      }`}
      // Se ignoran las transiciones que burbujean desde dentro (el color de un
      // botón al pasar el ratón, por ejemplo): solo interesa la de este nodo.
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget) setTerminoDeAbrir(open);
      }}
    >
      {/* Al cerrar, `open` pasa a false en el mismo render y el recorte vuelve
          de inmediato, antes de que empiece la animación de cierre. */}
      <div
        ref={contenido}
        inert={!open}
        className={open && terminoDeAbrir ? 'overflow-visible' : 'overflow-hidden'}
      >
        {children}
      </div>
    </div>
  );
}
