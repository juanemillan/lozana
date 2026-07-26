import 'server-only';

import { cookies, headers } from 'next/headers';
import { dictionaries } from './dictionaries';
import {
  isLocale,
  localeFromAcceptLanguage,
  LOCALE_COOKIE,
  type Locale,
} from './config';

export async function getRequestLocale(): Promise<Locale> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const savedLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(savedLocale)
    ? savedLocale
    : localeFromAcceptLanguage(headerStore.get('accept-language'));
}

export function serverTranslation(locale: Locale, key: string) {
  return dictionaries[locale][key] ?? dictionaries.es[key] ?? key;
}
