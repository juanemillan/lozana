/** Precio y tamaño. `Intl` hace el formato de moneda: sabe que CLP y JPY no llevan decimales. */

export const MONEDAS = [
  'CLP',
  'ARS',
  'BRL',
  'COP',
  'MXN',
  'PEN',
  'USD',
  'EUR',
  'GBP',
  'KRW',
  'JPY',
] as const;

export const UNIDADES = ['ml', 'g', 'unidad'] as const;
export type Unidad = (typeof UNIDADES)[number];

export function formatearPrecio(
  price?: number | null,
  currency?: string | null,
  locale = 'es',
): string | null {
  if (price == null) return null;
  // Sin moneda (registros anteriores a 007) se muestra el número pelado antes
  // que inventar un símbolo.
  if (!currency) return String(price);
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

export function formatearTamano(value?: number | null, unit?: string | null): string | null {
  if (value == null || !unit) return null;
  return `${value} ${unit}`;
}

/**
 * La cifra realmente comparable entre envases de distinto tamaño.
 * ml y g no se mezclan: son magnitudes distintas y compararlas no significa nada.
 */
export function precioPorUnidad(
  price?: number | null,
  currency?: string | null,
  value?: number | null,
  unit?: string | null,
  locale = 'es',
): string | null {
  if (price == null || !value || !unit) return null;
  const v = price / value;
  const formateado = currency
    ? new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: v < 1 ? 4 : 2,
      }).format(v)
    : v.toFixed(v < 1 ? 4 : 2);
  return `${formateado}/${unit}`;
}
