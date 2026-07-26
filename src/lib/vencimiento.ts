/**
 * Cálculo de vencimiento de productos. Es aritmética de fechas a propósito:
 * pasarlo por un modelo sería más lento, más caro y menos confiable que esto.
 */

export type Origen = 'pao' | 'impresa';
export type Estado = 'vencido' | 'pronto' | 'vigente' | 'desconocido';

export type Vencimiento = {
  fecha: string | null;
  origen: Origen | null;
  dias: number | null;
  estado: Estado;
};

/** Umbral para avisar. Un mes da margen para terminarlo o reponerlo. */
export const DIAS_AVISO = 30;

const DIA_MS = 86_400_000;

function soloFecha(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sumarMeses(iso: string, meses: number): Date | null {
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || !d) return null;
  // Date normaliza el desborde de mes por sí solo (mes 13 pasa a enero del año
  // siguiente), y el día 31 en un mes de 30 cae al 1 del siguiente. Para un
  // plazo de conservación esa aproximación es más que suficiente.
  return new Date(a, m - 1 + meses, d);
}

/**
 * Devuelve el vencimiento efectivo: el más cercano entre el impreso y el
 * calculado desde la apertura. Si el envase sigue cerrado, el PAO no corre.
 */
export function calcularVencimiento(p: {
  opened_at?: string | null;
  pao_months?: number | null;
  expires_at?: string | null;
}): Vencimiento {
  const candidatos: { fecha: Date; origen: Origen }[] = [];

  if (p.opened_at && p.pao_months) {
    const f = sumarMeses(p.opened_at, p.pao_months);
    if (f) candidatos.push({ fecha: f, origen: 'pao' });
  }

  if (p.expires_at) {
    const [a, m, d] = p.expires_at.split('-').map(Number);
    if (a && m && d) candidatos.push({ fecha: new Date(a, m - 1, d), origen: 'impresa' });
  }

  if (candidatos.length === 0) {
    return { fecha: null, origen: null, dias: null, estado: 'desconocido' };
  }

  candidatos.sort((x, y) => x.fecha.getTime() - y.fecha.getTime());
  const { fecha, origen } = candidatos[0];

  const dias = Math.round((soloFecha(fecha).getTime() - soloFecha(new Date()).getTime()) / DIA_MS);

  return {
    fecha: fecha.toISOString().slice(0, 10),
    origen,
    dias,
    estado: dias < 0 ? 'vencido' : dias <= DIAS_AVISO ? 'pronto' : 'vigente',
  };
}
