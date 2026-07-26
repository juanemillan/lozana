'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { SkeletonMetricas } from './ui/Skeleton';

function Metric({ num, label }: { num: number; label: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-surface px-4 py-3.5">
      <div className="font-serif text-[28px] leading-none text-sage-deep tabular-nums">{num}</div>
      <div className="mt-1.5 text-xs uppercase tracking-[0.5px] text-ink-soft">{label}</div>
    </div>
  );
}

/** Aparece mientras el perfil siga incompleto, incluido si postergaste el onboarding. */
function PerfilPendiente() {
  return (
    <Link
      href="/perfil"
      className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-dashed border-clay bg-clay-tint px-3.5 py-3 transition-colors hover:bg-clay/25"
    >
      <span className="text-[13px] text-clay-deep">
        Tu perfil está incompleto. Completarlo mejora lo que el asistente pueda recomendarte.
      </span>
      <ArrowRight size={15} strokeWidth={1.75} className="shrink-0 text-clay-deep" aria-hidden />
    </Link>
  );
}

export function Resumen() {
  const { profile } = useAuth();
  const [m, setM] = useState({ activos: 0, pendientes: 0, foods: 0, exercises: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const count = { count: 'exact' as const, head: true };
      const [activos, pendientes, foods, exercises] = await Promise.all([
        supabase.from('products').select('*', count).eq('status', 'Activo'),
        supabase.from('products').select('*', count).eq('status', 'Pendiente'),
        supabase.from('foods').select('*', count),
        supabase.from('exercises').select('*', count),
      ]);

      setM({
        activos: activos.count ?? 0,
        pendientes: pendientes.count ?? 0,
        foods: foods.count ?? 0,
        exercises: exercises.count ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <SkeletonMetricas />;

  return (
    <div className="mb-6">
      {profile && !profile.onboarding_completed_at && <PerfilPendiente />}

      <div className="anim-lista grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric num={m.activos} label="Productos activos" />
        <Metric num={m.pendientes} label="Pendientes" />
        <Metric num={m.foods} label="Ítems alimentación" />
        <Metric num={m.exercises} label="Hábitos de ejercicio" />
      </div>
    </div>
  );
}
