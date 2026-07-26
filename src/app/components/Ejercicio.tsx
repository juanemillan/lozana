'use client';
import { useEffect, useState } from 'react';
import { X, Plus, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { Card, CardName, CardMeta, CardNotes } from './ui/Card';
import { SectionTitle, EmptyState } from './ui/SectionTitle';
import { Button, IconButton } from './ui/Button';
import { Collapse } from './ui/Collapse';
import { Skeleton, CargandoTexto } from './ui/Skeleton';
import { Input, Textarea } from './ui/Field';
import { Autocomplete } from './ui/Autocomplete';
import { valoresUsados } from '@/lib/sugerencias';

type Exercise = {
  id: string;
  name: string;
  frequency: string;
  notes: string;
};

const EMPTY = { name: '', frequency: '', notes: '' };

export default function Ejercicio() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  async function fetchExercises() {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setExercises(data);
  }

  function nuevo() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function editar(ex: Exercise) {
    setEditing(ex.id);
    setForm({ name: ex.name, frequency: ex.frequency ?? '', notes: ex.notes ?? '' });
    setOpen(true);
  }

  function cerrar() {
    setOpen(false);
    setEditing(null);
    setForm(EMPTY);
  }

  async function deleteExercise(id: string) {
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) console.error(error);
    else fetchExercises();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form.name.trim()) return;

    const { error } = editing
      ? await supabase.from('exercises').update(form).eq('id', editing)
      : await supabase.from('exercises').insert({ ...form, user_id: user.id });

    if (error) console.error(error);
    else {
      await fetchExercises();
      cerrar();
    }
  }

  useEffect(() => {
    (async () => {
      await fetchExercises();
      setLoading(false);
    })();
  }, []);

  if (loading)
    return (
      <>
        <Skeleton filas={3} />
        <CargandoTexto />
      </>
    );

  return (
    <div className="anim-subir">
      <SectionTitle
        action={
          <Button onClick={() => (open ? cerrar() : nuevo())}>
            <Plus size={13} strokeWidth={2.25} aria-hidden />
            Agregar
          </Button>
        }
      >
        Ejercicio y hábitos
      </SectionTitle>

      <Collapse open={open}>
        <form
          onSubmit={handleSubmit}
          className="mb-3 rounded-[10px] border border-dashed border-line-strong bg-surface p-3.5"
        >
          <div className="mb-2 grid gap-2 sm:grid-cols-2">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Actividad"
              aria-label="Actividad"
            />
            <Autocomplete
              value={form.frequency}
              onChange={(v) => setForm({ ...form, frequency: v })}
              options={valoresUsados(exercises, (ex) => ex.frequency)}
              placeholder="Frecuencia"
              aria-label="Frecuencia"
            />
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas"
              aria-label="Notas"
              className="sm:col-span-2"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={cerrar}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? 'Guardar cambios' : 'Guardar'}</Button>
          </div>
        </form>
      </Collapse>

      {exercises.length === 0 ? (
        <EmptyState>Nada agregado todavía.</EmptyState>
      ) : (
        <div className="anim-lista">
          {exercises.map((ex) => (
            <Card
              key={ex.id}
              actions={
                <>
                  <IconButton label={`Editar ${ex.name}`} onClick={() => editar(ex)}>
                    <Pencil size={13} strokeWidth={2} aria-hidden />
                  </IconButton>
                  <IconButton label={`Eliminar ${ex.name}`} onClick={() => deleteExercise(ex.id)}>
                    <X size={13} strokeWidth={2} aria-hidden />
                  </IconButton>
                </>
              }
            >
              <CardName>{ex.name}</CardName>
              <CardMeta>{ex.frequency}</CardMeta>
              {ex.notes && <CardNotes>{ex.notes}</CardNotes>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
