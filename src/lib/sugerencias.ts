/**
 * Lógica de las sugerencias de autocompletado. Vive aparte del componente
 * porque es puro cálculo: así se puede probar sin montar React.
 */

/** Compara sin distinguir mayúsculas ni acentos: "tonico" encuentra "Tónico". */
export function normalizar(s: string) {
  return s
    .normalize('NFD')
    .replace(/[^\x20-\x7E]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Valores distintos de un campo, ordenados y sin vacíos.
 * La clave normalizada evita listar "CeraVe" y "cerave" como dos opciones
 * distintas.
 *
 * Gana la primera aparición, y las listas llegan ordenadas de más nueva a más
 * vieja: si el usuario escribió "cerave" hace meses y "CeraVe" ayer, se sugiere
 * la de ayer. Se asume que la escritura más reciente es la corregida.
 */
export function valoresUsados<T>(items: T[], campo: (item: T) => string | null | undefined) {
  const vistos = new Map<string, string>();
  for (const it of items) {
    const v = campo(it)?.trim();
    if (!v) continue;
    const clave = normalizar(v);
    if (!vistos.has(clave)) vistos.set(clave, v);
  }
  return [...vistos.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Opciones que coinciden con lo escrito. Excluye la coincidencia exacta:
 * sugerir lo que ya está escrito no aporta nada y ocupa un lugar de la lista.
 */
export function filtrarSugerencias(options: string[], valor: string, max: number) {
  const consulta = normalizar(valor);
  return options
    .filter((o) => {
      const n = normalizar(o);
      return n !== consulta && (consulta === '' || n.includes(consulta));
    })
    .slice(0, max);
}
