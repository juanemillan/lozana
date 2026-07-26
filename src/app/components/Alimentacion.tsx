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
import { Input, Select, Textarea } from './ui/Field';
import { Autocomplete } from './ui/Autocomplete';
import { valoresUsados } from '@/lib/sugerencias';
import { useI18n } from '@/i18n/I18nProvider';

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
  const { t, label } = useI18n();
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

  if (loading)
    return (
      <>
        <Skeleton filas={3} />
        <CargandoTexto>{t('common.loading')}</CargandoTexto>
      </>
    );

  return (
    <div className="anim-subir">
      <SectionTitle
        action={
          <Button onClick={() => (open ? cerrar() : nuevo())}>
            <Plus size={13} strokeWidth={2.25} aria-hidden />
            {t('common.add')}
          </Button>
        }
      >
        {t('food.title')}
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
              placeholder={t('food.name')}
              aria-label={t('food.name')}
            />
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              aria-label={t('food.category')}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{label(c)}</option>
              ))}
            </Select>
            <Autocomplete
              value={form.frequency}
              onChange={(v) => setForm({ ...form, frequency: v })}
              options={valoresUsados(foods, (f) => f.frequency)}
              placeholder={t('common.frequency')}
              aria-label={t('common.frequency')}
            />
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={t('food.notesExample')}
              aria-label={t('common.notes')}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={cerrar}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {editing ? t('common.saveChanges') : t('common.save')}
            </Button>
          </div>
        </form>
      </Collapse>

      {foods.length === 0 ? (
        <EmptyState>{t('food.empty')}</EmptyState>
      ) : (
        <div className="anim-lista">
          {foods.map((f) => (
            <Card
              key={f.id}
              actions={
                <>
                  <IconButton label={t('actions.editNamed', { name: f.name })} onClick={() => editar(f)}>
                    <Pencil size={13} strokeWidth={2} aria-hidden />
                  </IconButton>
                  <IconButton label={t('actions.deleteNamed', { name: f.name })} onClick={() => deleteFood(f.id)}>
                    <X size={13} strokeWidth={2} aria-hidden />
                  </IconButton>
                </>
              }
            >
              <CardName>{f.name}</CardName>
              <CardMeta>{[label(f.category), f.frequency].filter(Boolean).join(' · ')}</CardMeta>
              {f.notes && <CardNotes>{f.notes}</CardNotes>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
