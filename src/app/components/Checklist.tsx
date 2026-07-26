'use client';
import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { SectionTitle, EmptyState } from './ui/SectionTitle';

type ChecklistItem = {
  product_id: string;
  name: string;
  time_of_day: string;
  entry_id: string | null;
  done_am: boolean;
  done_pm: boolean;
};

function ToggleSlot({
  label,
  done,
  onClick,
}: {
  label: string;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={done}
      className={`w-11 rounded-[10px] border px-2 py-1 font-mono text-[10px] leading-none tracking-wide
        transition-colors cursor-pointer
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage ${
          done
            ? 'border-transparent bg-sage text-white'
            : 'border-line-strong bg-surface text-ink-soft hover:bg-sage-tint hover:text-sage-deep'
        }`}
    >
      {label}
    </button>
  );
}

export default function Checklist() {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);
  const [streak, setStreak] = useState(0);

  async function loadChecklist() {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, time_of_day')
      .eq('status', 'Activo');

    const { data: entries } = await supabase
      .from('checklist_entries')
      .select('*')
      .eq('entry_date', today);

    const merged = (products || []).map((p) => {
      const entry = entries?.find((e) => e.product_id === p.id);
      return {
        product_id: p.id,
        name: p.name,
        time_of_day: p.time_of_day,
        entry_id: entry?.id ?? null,
        done_am: entry?.done_am ?? false,
        done_pm: entry?.done_pm ?? false,
      };
    });

    setItems(merged);
  }

  async function toggle(item: ChecklistItem, field: 'done_am' | 'done_pm') {
    const newValue = !item[field];

    if (!user) return;

    if (item.entry_id) {
      await supabase.from('checklist_entries').update({ [field]: newValue }).eq('id', item.entry_id);
    } else {
      await supabase.from('checklist_entries').insert({
        user_id: user.id,
        product_id: item.product_id,
        entry_date: today,
        [field]: newValue,
      });
    }
    loadChecklist();
  }

  async function getStreak(): Promise<number> {
    const { data } = await supabase
      .from('checklist_entries')
      .select('entry_date, done_am, done_pm')
      .or('done_am.eq.true,done_pm.eq.true')
      .order('entry_date', { ascending: false });

    if (!data || data.length === 0) return 0;

    const uniqueDates = [...new Set(data.map((d) => d.entry_date))].sort().reverse();

    let streak = 0;
    const cursor = new Date();

    for (const dateStr of uniqueDates) {
      const expected = cursor.toISOString().slice(0, 10);
      if (dateStr === expected) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // Va después de las declaraciones porque el lint de React Compiler no admite
  // referenciarlas antes, aunque las function declarations se hoisteen.
  useEffect(() => {
    (async () => {
      const [, days] = await Promise.all([loadChecklist(), getStreak()]);
      setStreak(days);
      setLoading(false);
    })();
    // Solo al montar. loadChecklist cierra sobre `today`, que se recalcula en cada
    // render, así que incluirlo en las deps dispararía un refetch infinito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="text-[13px] text-ink-soft">Cargando...</p>;

  return (
    <div>
      <SectionTitle
        action={
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-clay-deep">
            <Flame size={14} strokeWidth={1.75} aria-hidden />
            {streak} {streak === 1 ? 'día' : 'días'} seguidos
          </span>
        }
      >
        Hoy
      </SectionTitle>

      {items.length === 0 ? (
        <EmptyState>Sin productos activos. Agregá algunos en Productos.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-line bg-surface">
          {items.map((item) => (
            <div
              key={item.product_id}
              className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2.5 last:border-b-0"
            >
              <span className="min-w-0 text-sm">{item.name}</span>
              <div className="flex shrink-0 gap-1.5">
                {(item.time_of_day === 'AM' || item.time_of_day === 'AM/PM') && (
                  <ToggleSlot label="AM" done={item.done_am} onClick={() => toggle(item, 'done_am')} />
                )}
                {(item.time_of_day === 'PM' || item.time_of_day === 'AM/PM') && (
                  <ToggleSlot label="PM" done={item.done_pm} onClick={() => toggle(item, 'done_pm')} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
