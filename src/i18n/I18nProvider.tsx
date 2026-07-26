'use client';

import { createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { dictionaries } from './dictionaries';
import { LOCALE_COOKIE, type Locale } from './config';

type Variables = Record<string, string | number>;
type I18nValue = {
  locale: Locale;
  t: (key: string, variables?: Variables) => string;
  label: (storedValue: string) => string;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const value = useMemo<I18nValue>(() => {
    const t = (key: string, variables: Variables = {}) => {
      const template = dictionaries[locale][key] ?? dictionaries.es[key] ?? key;
      return Object.entries(variables).reduce(
        (result, [name, replacement]) =>
          result.replaceAll(`{${name}}`, String(replacement)),
        template,
      );
    };

    return {
      locale,
      t,
      label(storedValue) {
        return dictionaries[locale][`value.${storedValue}`] ?? storedValue;
      },
      setLocale(nextLocale) {
        document.cookie = `${LOCALE_COOKIE}=${nextLocale};path=/;max-age=31536000;samesite=lax`;
        document.documentElement.lang = nextLocale;
        router.refresh();
      },
    };
  }, [locale, router]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
