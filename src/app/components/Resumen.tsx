'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { calcularVencimiento } from '@/lib/vencimiento';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { SkeletonMetricas } from './ui/Skeleton';
import { useI18n } from '@/i18n/I18nProvider';

function Metric({ num, label }: { num: number; label: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-surface px-4 py-3.5">
      <div className="font-serif text-[28px] leading-none text-sage-deep tabular-nums">{num}</div>
      <div className="mt-1.5 text-xs uppercase tracking-[0.5px] text-ink-soft">{label}</div>
    </div>
  );
}

/**
 * Aviso de productos por vencer. Es aritmética de fechas, no una consulta a un
 * modelo: aquí una IA sería más lenta, más cara y menos exacta que restar días.
 */
function AvisoVencimiento({ vencidos, prontos }: { vencidos: number; prontos: number }) {
  const { t } = useI18n();
  if (vencidos === 0 && prontos === 0) return null;

  const partes = [
    vencidos > 0 &&
      t(vencidos === 1 ? 'summary.expired.one' : 'summary.expired.other', {
        count: vencidos,
      }),
    prontos > 0 && t('summary.expiring', { count: prontos }),
  ].filter(Boolean);

  return (
    <Link
      href="/productos"
      className={`mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-dashed px-3.5 py-3 transition-colors ${
        vencidos > 0
          ? 'border-plum bg-plum-tint hover:bg-plum/25'
          : 'border-clay bg-clay-tint hover:bg-clay/25'
      }`}
    >
      <span className="inline-flex items-center gap-2 text-[13px]">
        <CalendarClock
          size={15}
          strokeWidth={1.75}
          className={`shrink-0 ${vencidos > 0 ? 'text-plum-deep' : 'text-clay-deep'}`}
          aria-hidden
        />
        <span className={vencidos > 0 ? 'text-plum-deep' : 'text-clay-deep'}>
          {t('summary.notice', { items: partes.join(t('summary.joiner')) })}
        </span>
      </span>
      <ArrowRight
        size={15}
        strokeWidth={1.75}
        className={`shrink-0 ${vencidos > 0 ? 'text-plum-deep' : 'text-clay-deep'}`}
        aria-hidden
      />
    </Link>
  );
}

/** Aparece mientras el perfil siga incompleto, incluido si postergaste el onboarding. */
function PerfilPendiente() {
  const { t } = useI18n();
  return (
    <Link
      href="/perfil"
      className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-dashed border-clay bg-clay-tint px-3.5 py-3 transition-colors hover:bg-clay/25"
    >
      <span className="text-[13px] text-clay-deep">
        {t('summary.incomplete')}
      </span>
      <ArrowRight size={15} strokeWidth={1.75} className="shrink-0 text-clay-deep" aria-hidden />
    </Link>
  );
}

export function Resumen() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [m, setM] = useState({ activos: 0, pendientes: 0, foods: 0, exercises: 0 });
  const [caducidad, setCaducidad] = useState({ vencidos: 0, prontos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const count = { count: 'exact' as const, head: true };
      const [activos, pendientes, foods, exercises, fechas] = await Promise.all([
        supabase.from('products').select('*', count).eq('status', 'Activo'),
        supabase.from('products').select('*', count).eq('status', 'Pendiente'),
        supabase.from('foods').select('*', count),
        supabase.from('exercises').select('*', count),
        // Solo las tres columnas de fecha: no hace falta traer el producto entero
        // para contar cuántos están por vencer.
        supabase.from('products').select('opened_at, pao_months, expires_at'),
      ]);

      setM({
        activos: activos.count ?? 0,
        pendientes: pendientes.count ?? 0,
        foods: foods.count ?? 0,
        exercises: exercises.count ?? 0,
      });

      const estados = (fechas.data ?? []).map(calcularVencimiento);
      setCaducidad({
        vencidos: estados.filter((v) => v.estado === 'vencido').length,
        prontos: estados.filter((v) => v.estado === 'pronto').length,
      });

      setLoading(false);
    })();
  }, []);

  if (loading) return <SkeletonMetricas />;

  return (
    <div className="mb-6">
      {profile && !profile.onboarding_completed_at && <PerfilPendiente />}
      <AvisoVencimiento vencidos={caducidad.vencidos} prontos={caducidad.prontos} />

      <div className="anim-lista grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric num={m.activos} label={t('summary.activeProducts')} />
        <Metric num={m.pendientes} label={t('summary.pending')} />
        <Metric num={m.foods} label={t('summary.foodItems')} />
        <Metric num={m.exercises} label={t('summary.exerciseHabits')} />
      </div>
    </div>
  );
}
