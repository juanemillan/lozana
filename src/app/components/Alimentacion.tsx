'use client';
import { useEffect, useState } from 'react';
import { X, Plus, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { Card, CardName, CardMeta, CardNotes } from './ui/Card';
import { SectionTitle, EmptyState } from './ui/SectionTitle';
import { Button, IconButton } from './ui/Button';
import { Input, Select, Textarea } from './ui/Field';

const CATEGORIES = [
  'Estructura',
  'Suplemento',
  'Volumen/barrera',
  'Protección',
  'Hidratación',
  'Restricción',
];

type Food = {
  id: string;
  name: string;
  category: string;
  frequency: string;
  notes: string;
};

const EMPTY = { name: '', category: CATEGORIES[0], frequency: '', notes: '' };

export default function Alimentacion() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  async function fetchFoods() {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setFoods(data);
  }

  function nuevo() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function editar(f: Food) {
    setEditing(f.id);
    setForm({
      name: f.name,
      category: f.category ?? CATEGORIES[0],
      frequency: f.frequency ?? '',
      notes: f.notes ?? '',
    });
    setOpen(true);
  }

  function cerrar() {
    setOpen(false);
    setEditing(null);
    setForm(EMPTY);
  }

  async function deleteFood(id: string) {
    const { error } = await supabase.from('foods').delete().eq('id', id);
    if (error) console.error(error);
    else fetchFoods();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form.name.trim()) return;

    const { error } = editing
      ? await supabase.from('foods').update(form).eq('id', editing)
      : await supabase.from('foods').insert({ ...form, user_id: user.id });

    if (error) console.error(error);
    else {
      await fetchFoods();
      cerrar();
    }
  }

  useEffect(() => {
    (async () => {
      await fetchFoods();
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-[13px] text-ink-soft">Cargando...</p>;

  return (
    <div>
      <SectionTitle
        action={
          <Button onClick={() => (open ? cerrar() : nuevo())}>
            <Plus size={13} strokeWidth={2.25} aria-hidden />
            Agregar
          </Button>
        }
      >
        Alimentación
      </SectionTitle>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mb-3 rounded-[10px] border border-dashed border-line-strong bg-surface p-3.5"
        >
          <div className="mb-2 grid gap-2 sm:grid-cols-2">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Alimento o hábito"
              aria-label="Alimento o hábito"
              autoFocus
            />
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              aria-label="Categoría"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
            <Input
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              placeholder="Frecuencia"
              aria-label="Frecuencia"
            />
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas"
              aria-label="Notas"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={cerrar}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? 'Guardar cambios' : 'Guardar'}</Button>
          </div>
        </form>
      )}

      {foods.length === 0 ? (
        <EmptyState>Nada agregado todavía.</EmptyState>
      ) : (
        foods.map((f) => (
          <Card
            key={f.id}
            actions={
              <>
                <IconButton label={`Editar ${f.name}`} onClick={() => editar(f)}>
                  <Pencil size={13} strokeWidth={2} aria-hidden />
                </IconButton>
                <IconButton label={`Eliminar ${f.name}`} onClick={() => deleteFood(f.id)}>
                  <X size={13} strokeWidth={2} aria-hidden />
                </IconButton>
              </>
            }
          >
            <CardName>{f.name}</CardName>
            <CardMeta>{[f.category, f.frequency].filter(Boolean).join(' · ')}</CardMeta>
            {f.notes && <CardNotes>{f.notes}</CardNotes>}
          </Card>
        ))
      )}
    </div>
  );
}
