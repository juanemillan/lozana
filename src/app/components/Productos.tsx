'use client';
import { useEffect, useState } from 'react';
import { X, Plus, Pencil, ImagePlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/uploadImage';
import { useAuth } from './AuthProvider';
import { Card, CardName, CardMeta, CardNotes } from './ui/Card';
import { SectionTitle, EmptyState } from './ui/SectionTitle';
import { TimePill, StatusPill } from './ui/Pill';
import { Button, IconButton } from './ui/Button';
import { Input, Select, Textarea } from './ui/Field';
import { Thumb } from './ui/Avatar';

const CATEGORIES = [
  'Limpiador',
  'Tónico',
  'Sérum',
  'Tratamiento',
  'Ojos',
  'Hidratante',
  'Protector Solar',
  'Herramienta',
];
const TIMES = ['AM', 'PM', 'AM/PM'];
const STATUSES = ['Activo', 'Pendiente', 'Pausado'];

type Product = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number | null;
  time_of_day: string;
  frequency: string;
  status: string;
  notes: string | null;
  image_path: string | null;
};

type Draft = Omit<Product, 'id' | 'image_path'>;

const EMPTY: Draft = {
  name: '',
  category: CATEGORIES[0],
  description: '',
  price: null,
  time_of_day: TIMES[0],
  frequency: '',
  status: STATUSES[0],
  notes: '',
};

export default function Productos() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Draft>(EMPTY);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setProducts(data);
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function nuevo() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function editar(p: Product) {
    setEditing(p.id);
    setForm({
      name: p.name,
      category: p.category,
      description: p.description ?? '',
      price: p.price,
      time_of_day: p.time_of_day,
      frequency: p.frequency ?? '',
      status: p.status,
      notes: p.notes ?? '',
    });
    setOpen(true);
  }

  function cerrar() {
    setOpen(false);
    setEditing(null);
    setForm(EMPTY);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form.name.trim()) return;

    const payload = {
      ...form,
      description: form.description?.trim() || null,
      notes: form.notes?.trim() || null,
    };

    const { error } = editing
      ? await supabase.from('products').update(payload).eq('id', editing)
      : await supabase.from('products').insert({ ...payload, user_id: user.id });

    if (error) console.error(error);
    else {
      await fetchProducts();
      cerrar();
    }
  }

  async function updateProduct(id: string, updates: Partial<Product>) {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) console.error(error);
    else fetchProducts();
  }

  async function deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) console.error(error);
    else fetchProducts();
  }

  useEffect(() => {
    (async () => {
      await fetchProducts();
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
        Productos
      </SectionTitle>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mb-3 rounded-[10px] border border-dashed border-line-strong bg-surface p-3.5"
        >
          <div className="mb-2 grid gap-2 sm:grid-cols-2">
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Nombre del producto"
              aria-label="Nombre"
              className="sm:col-span-2"
              autoFocus
            />
            <Select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              aria-label="Categoría"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
            <Select
              value={form.time_of_day}
              onChange={(e) => set('time_of_day', e.target.value)}
              aria-label="Momento del día"
            >
              {TIMES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
            <Input
              value={form.frequency}
              onChange={(e) => set('frequency', e.target.value)}
              placeholder="Frecuencia (ej: Diario, 2x/semana)"
              aria-label="Frecuencia"
            />
            <Select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              aria-label="Estado"
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.price ?? ''}
              onChange={(e) => set('price', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Precio"
              aria-label="Precio"
            />
            <Input
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Descripción"
              aria-label="Descripción"
            />
            <Textarea
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
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
      )}

      {products.length === 0 ? (
        <EmptyState>Nada agregado todavía.</EmptyState>
      ) : (
        products.map((p) => (
          <Card
            key={p.id}
            actions={
              <>
                <IconButton label={`Editar ${p.name}`} onClick={() => editar(p)}>
                  <Pencil size={13} strokeWidth={2} aria-hidden />
                </IconButton>
                <IconButton label={`Eliminar ${p.name}`} onClick={() => deleteProduct(p.id)}>
                  <X size={13} strokeWidth={2} aria-hidden />
                </IconButton>
              </>
            }
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <CardName>{p.name}</CardName>
              <TimePill time={p.time_of_day} />
              <StatusPill status={p.status} />
            </div>

            <CardMeta>
              {[p.category, p.frequency, p.price != null && `$${p.price}`]
                .filter(Boolean)
                .join(' · ')}
            </CardMeta>

            {p.description && <CardMeta>{p.description}</CardMeta>}
            {p.notes && <CardNotes>{p.notes}</CardNotes>}

            <Thumb path={p.image_path} alt={p.name} />

            <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-ink-soft hover:text-sage-deep">
              <ImagePlus size={13} strokeWidth={1.75} aria-hidden />
              {p.image_path ? 'Cambiar foto' : 'Agregar foto'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file || !user) return;
                  const path = await uploadImage(file, user.id, 'products');
                  if (path) updateProduct(p.id, { image_path: path });
                }}
              />
            </label>
          </Card>
        ))
      )}
    </div>
  );
}
