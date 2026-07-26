'use client';
import { useEffect, useState } from 'react';
import { X, Plus, Pencil, ImagePlus, ExternalLink } from 'lucide-react';
import { calcularVencimiento, etiquetaVencimiento, precioPorUnidad } from '@/lib/vencimiento';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/uploadImage';
import { useAuth } from './AuthProvider';
import { Card, CardName, CardMeta, CardNotes } from './ui/Card';
import { SectionTitle, EmptyState } from './ui/SectionTitle';
import { Pill, TimePill, StatusPill } from './ui/Pill';
import { Button, IconButton } from './ui/Button';
import { Collapse } from './ui/Collapse';
import { Skeleton, CargandoTexto } from './ui/Skeleton';
import { Input, Label, Select, Textarea } from './ui/Field';
import { Autocomplete } from './ui/Autocomplete';
import { valoresUsados, normalizar } from '@/lib/sugerencias';
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
  brand: string | null;
  product_line: string | null;
  category: string;
  description: string | null;
  price: number | null;
  size_ml: number | null;
  purchase_url: string | null;
  opened_at: string | null;
  pao_months: number | null;
  expires_at: string | null;
  repurchase: boolean | null;
  time_of_day: string;
  frequency: string;
  status: string;
  notes: string | null;
  image_path: string | null;
};

type Draft = Omit<Product, 'id' | 'image_path'>;

const EMPTY: Draft = {
  name: '',
  brand: '',
  product_line: '',
  category: CATEGORIES[0],
  description: '',
  price: null,
  size_ml: null,
  purchase_url: '',
  opened_at: null,
  pao_months: null,
  expires_at: null,
  repurchase: null,
  time_of_day: TIMES[0],
  frequency: '',
  status: STATUSES[0],
  notes: '',
};

/** Solo aparece cuando hay algo que avisar; si está vigente no ocupa espacio. */
function VencimientoPill({ producto }: { producto: Product }) {
  const v = calcularVencimiento(producto);
  const texto = etiquetaVencimiento(v);
  if (!texto) return null;

  return (
    <Pill tone={v.estado === 'vencido' ? 'plum' : 'clay'}>
      {texto}
      {v.origen === 'pao' && ' · desde apertura'}
    </Pill>
  );
}

/** Convierte lo que escribe el usuario en número o null, sin dejar NaN. */
function aNumero(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

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
      brand: p.brand ?? '',
      product_line: p.product_line ?? '',
      category: p.category,
      description: p.description ?? '',
      price: p.price,
      size_ml: p.size_ml,
      purchase_url: p.purchase_url ?? '',
      opened_at: p.opened_at,
      pao_months: p.pao_months,
      expires_at: p.expires_at,
      repurchase: p.repurchase,
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

    // Las cadenas vacías se guardan como null: en la base "sin dato" y "cadena
    // vacía" son cosas distintas, y mezclarlas complica cualquier consulta.
    const payload = {
      ...form,
      brand: form.brand?.trim() || null,
      product_line: form.product_line?.trim() || null,
      description: form.description?.trim() || null,
      purchase_url: form.purchase_url?.trim() || null,
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

  // Las sugerencias salen de lo que el propio usuario ya cargó, así que son
  // ciertas por construcción: no hay nada generado ni traído de fuera.
  const marcasUsadas = valoresUsados(products, (p) => p.brand);
  const frecuenciasUsadas = valoresUsados(products, (p) => p.frequency);

  // Las líneas se acotan a la marca que se está escribiendo: proponer una línea
  // de Purito mientras cargas un CeraVe sería ruido. Sin marca aún, se ofrecen
  // todas.
  const marcaActual = normalizar(form.brand ?? '');
  const lineasUsadas = valoresUsados(
    marcaActual ? products.filter((p) => normalizar(p.brand ?? '') === marcaActual) : products,
    (p) => p.product_line,
  );

  useEffect(() => {
    (async () => {
      await fetchProducts();
      setLoading(false);
    })();
  }, []);

  if (loading)
    return (
      <>
        <Skeleton filas={4} />
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
        Productos
      </SectionTitle>

      <Collapse open={open}>
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
            />
            <Autocomplete
              value={form.brand ?? ''}
              onChange={(v) => set('brand', v)}
              options={marcasUsadas}
              placeholder="Marca"
              aria-label="Marca"
            />
            <Autocomplete
              value={form.product_line ?? ''}
              onChange={(v) => set('product_line', v)}
              options={lineasUsadas}
              placeholder="Línea (opcional)"
              aria-label="Línea"
              className="sm:col-span-2"
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
            <Autocomplete
              value={form.frequency}
              onChange={(v) => set('frequency', v)}
              options={frecuenciasUsadas}
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
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Descripción"
              aria-label="Descripción"
              className="sm:col-span-2"
            />
            <Textarea
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Notas"
              aria-label="Notas"
              className="sm:col-span-2"
            />
          </div>

          <p className="mt-4 mb-2 border-t border-line pt-3 font-mono text-[11px] uppercase tracking-wide text-ink-soft">
            Compra y vencimiento
          </p>

          <div className="mb-2 grid gap-2 sm:grid-cols-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.price ?? ''}
              onChange={(e) => set('price', aNumero(e.target.value))}
              placeholder="Precio"
              aria-label="Precio"
            />
            <Input
              type="number"
              step="0.1"
              min="0"
              value={form.size_ml ?? ''}
              onChange={(e) => set('size_ml', aNumero(e.target.value))}
              placeholder="Tamaño en ml o g"
              aria-label="Tamaño"
            />
            <Input
              type="url"
              value={form.purchase_url ?? ''}
              onChange={(e) => set('purchase_url', e.target.value)}
              placeholder="Link donde lo compraste"
              aria-label="Link de compra"
              className="sm:col-span-2"
            />

            <div>
              <Label htmlFor="abierto">Fecha en que lo abriste</Label>
              <Input
                id="abierto"
                type="date"
                value={form.opened_at ?? ''}
                onChange={(e) => set('opened_at', e.target.value || null)}
              />
            </div>
            <div>
              {/* El PAO es el símbolo del tarrito abierto con "6M" o "12M". */}
              <Label htmlFor="pao">Meses de uso tras abrir (PAO)</Label>
              <Input
                id="pao"
                type="number"
                min="1"
                max="60"
                value={form.pao_months ?? ''}
                onChange={(e) => set('pao_months', aNumero(e.target.value))}
                placeholder="6"
              />
            </div>
            <div>
              <Label htmlFor="vence">Vencimiento impreso</Label>
              <Input
                id="vence"
                type="date"
                value={form.expires_at ?? ''}
                onChange={(e) => set('expires_at', e.target.value || null)}
              />
            </div>
            <div>
              <Label htmlFor="recompra">¿Lo volverías a comprar?</Label>
              <Select
                id="recompra"
                value={form.repurchase === null ? '' : form.repurchase ? 'si' : 'no'}
                onChange={(e) =>
                  set('repurchase', e.target.value === '' ? null : e.target.value === 'si')
                }
              >
                <option value="">Sin decidir</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={cerrar}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? 'Guardar cambios' : 'Guardar'}</Button>
          </div>
        </form>
      </Collapse>

      {products.length === 0 ? (
        <EmptyState>Nada agregado todavía.</EmptyState>
      ) : (
        <div className="anim-lista">
          {products.map((p) => (
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
                <CardName>{[p.brand, p.product_line, p.name].filter(Boolean).join(' · ')}</CardName>
                <TimePill time={p.time_of_day} />
                <StatusPill status={p.status} />
                <VencimientoPill producto={p} />
              </div>

              <CardMeta>
                {[
                  p.category,
                  p.frequency,
                  p.price != null && `$${p.price}`,
                  p.size_ml && `${p.size_ml}ml`,
                  precioPorUnidad(p.price, p.size_ml),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </CardMeta>

              {p.description && <CardMeta>{p.description}</CardMeta>}
              {p.notes && <CardNotes>{p.notes}</CardNotes>}

              {p.purchase_url && (
                <a
                  href={p.purchase_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-sage-deep underline underline-offset-2 transition-colors hover:text-sage"
                >
                  <ExternalLink size={11} strokeWidth={1.75} aria-hidden />
                  Dónde lo compré
                </a>
              )}

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
          ))}
        </div>
      )}
    </div>
  );
}
