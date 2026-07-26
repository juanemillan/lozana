export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';
export const LOCALE_COOKIE = 'lozana_locale';

export function isLocale(value?: string | null): value is Locale {
  return value === 'es' || value === 'en';
}

export function localeFromAcceptLanguage(header?: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const languages = header
    .split(',')
    .map((part) => {
      const [tag, quality] = part.trim().split(';q=');
      return { tag: tag.toLowerCase(), quality: quality ? Number(quality) : 1 };
    })
    .filter(({ quality }) => Number.isFinite(quality) && quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of languages) {
    if (tag === 'en' || tag.startsWith('en-')) return 'en';
    if (tag === 'es' || tag.startsWith('es-')) return 'es';
  }

  return DEFAULT_LOCALE;
}
