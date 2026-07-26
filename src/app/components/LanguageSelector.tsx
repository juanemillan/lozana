'use client';

import { Languages } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

export function LanguageSelector({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label
      className={`inline-flex items-center gap-1.5 font-mono text-[10px] text-ink-soft ${className}`}
    >
      <Languages size={13} strokeWidth={1.75} aria-hidden />
      <span className="sr-only">{t('language.label')}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as 'es' | 'en')}
        aria-label={t('language.label')}
        className="cursor-pointer border-0 bg-transparent py-1 text-[10px] uppercase text-ink-soft outline-none focus-visible:ring-2 focus-visible:ring-sage/30"
      >
        <option value="es">{t('language.es')}</option>
        <option value="en">{t('language.en')}</option>
      </select>
    </label>
  );
}
