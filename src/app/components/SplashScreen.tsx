'use client';

import { useI18n } from '@/i18n/I18nProvider';

export function SplashScreen({ exiting = false }: { exiting?: boolean }) {
  const { t } = useI18n();

  return (
    <div
      role="status"
      aria-label={t('common.loading')}
      className={`lz-splash ${exiting ? 'lz-splash--sale' : ''}`}
    >
      <div className="lz-splash__contenido">
        <svg
          viewBox="0 0 100 100"
          className="lz-splash__simbolo"
          aria-hidden
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            pathLength="1"
            className="lz-splash__circulo"
          />
          <path
            d="M33,70 L33,44 A17,17 0 0 1 67,44 L67,70"
            pathLength="1"
            className="lz-splash__arco"
          />
        </svg>

        <div className="lz-splash__marca" aria-hidden>
          <span className="font-semibold text-sage">lo</span>
          <span className="font-light italic text-clay">zana</span>
        </div>
        <p className="lz-splash__subtitulo">{t('app.subtitle')}</p>
        <span className="lz-splash__linea" aria-hidden />
      </div>
    </div>
  );
}
