'use client';
import { useEffect, useState } from 'react';
import { X, Plus, Pencil, ImagePlus, Camera, ExternalLink, ChevronDown } from 'lucide-react';
import { calcularVencimiento, etiquetaVencimiento } from '@/lib/vencimiento';
import {
  MONEDAS,
  UNIDADES,
  formatearPrecio,
  formatearTamano,
  precioPorUnidad,
} from '@/lib/precio';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/uploadImage';
import { useAuth } from './AuthProvider';
import { CardMeta, CardNotes } from './ui/Card';
import { SectionTitle, EmptyState } from './ui/SectionTitle';
import { Pill, TimePill, StatusPill } from './ui/Pill';
import { Button } from './ui/Button';
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
  currency_code: string | null;
  size_value: number | null;
  size_unit: string | null;
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
  currency_code: 'CLP',
  size_value: null,
  size_unit: 'ml',
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
  const [foto, setFoto] = useState<File | null>(null);
  const [previo, setPrevio] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      // Sin `?? 'CLP'`: inventarle moneda a un registro anterior a 007 sería
      // afirmar un dato que nadie introdujo.
      currency_code: p.currency_code,
      size_value: p.size_value,
      size_unit: p.size_unit,
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
    soltarPrevio();
    setFoto(null);
  }

  /** El blob de la previsualización ocupa memoria hasta que se revoca. */
  function soltarPrevio() {
    setPrevio((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
  }

  function elegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    soltarPrevio();
    setFoto(file);
    setPrevio(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form.name.trim() || guardando) return;

    // Mismas reglas que los constraints de 007, comprobadas antes para dar un
    // mensaje en castellano en vez del error crudo de Postgres.
    if (form.price != null && !form.currency_code) {
      return setAviso('Elige la moneda del precio.');
    }
    if (form.size_value != null && !form.size_unit) {
      return setAviso('Elige la unidad del tamaño.');
    }

    setGuardando(true);
    setAviso(null);

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

    // La foto se sube después de guardar, porque en un alta todavía no hay id
    // al que asociarla. Si no se eligió ninguna, `image_path` no se toca.
    let id = editing;
    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing);
      if (error) return fallar(error.message);
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert({ ...payload, user_id: user.id })
        .select('id')
        .single();
      if (error) return fallar(error.message);
      id = data.id;
    }

    let fotoFallo = false;
    if (foto && id) {
      const path = await uploadImage(foto, user.id, 'products');
      const { error } = path
        ? await supabase.from('products').update({ image_path: path }).eq('id', id)
        : { error: true };
      fotoFallo = Boolean(error);
    }

    await fetchProducts();
    cerrar();
    setGuardando(false);
    // El producto sí quedó guardado: cerrar el formulario evita que reintentar
    // cree un duplicado, y el aviso explica qué faltó.
    setAviso(fotoFallo ? 'El producto se guardó, pero la foto no se pudo subir. Edítalo para reintentar.' : null);
  }

  function fallar(mensaje: string) {
    setGuardando(false);
    setAviso(`No se pudo guardar: ${mensaje}`);
  }

  async function deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) setAviso(`No se pudo eliminar: ${error.message}`);
    else {
      setExpandedId((actual) => (actual === id ? null : actual));
      fetchProducts();
    }
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

      {/* Fuera del Collapse: un fallo al subir la foto cierra el formulario
          (el producto ya se guardó) y el mensaje tiene que seguir visible. */}
      {aviso && (
        <p
          role="alert"
          className="mb-3 rounded-[10px] border border-plum bg-plum-tint px-3.5 py-2.5 text-[13px] text-plum-deep"
        >
          {aviso}
        </p>
      )}

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
              placeholder="Descripción: qué es. Ej: sérum facial con retinal"
              aria-label="Descripción"
              className="sm:col-span-2"
            />
            <Textarea
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Notas: cómo te va con él. Ej: empezar dos noches por semana y observar tolerancia"
              aria-label="Notas"
              className="sm:col-span-2"
            />
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-line pt-3">
            {previo ? (
              <span className="block size-14 shrink-0 overflow-hidden rounded-md border border-line bg-paper">
                {/* eslint-disable-next-line @next/next/no-img-element -- blob local, no pasa por el optimizador */}
                <img src={previo} alt="" className="size-full object-cover" />
              </span>
            ) : (
              <Thumb path={editing ? (products.find((p) => p.id === editing)?.image_path ?? null) : null} alt="" />
            )}

            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <label className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-ink-soft transition-colors hover:text-sage-deep">
                <ImagePlus size={13} strokeWidth={1.75} aria-hidden />
                {previo ? 'Cambiar foto' : 'Subir foto'}
                <input type="file" accept="image/*" className="sr-only" onChange={elegirFoto} />
              </label>
              {/* capture solo lo honra el móvil; en escritorio abriría el mismo
                  explorador que el botón de al lado. */}
              <label className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-ink-soft transition-colors hover:text-sage-deep md:hidden">
                <Camera size={13} strokeWidth={1.75} aria-hidden />
                Tomar foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={elegirFoto}
                />
              </label>
              {previo && (
                <p className="w-full font-mono text-[11px] text-ink-soft">
                  Se sube al guardar.
                </p>
              )}
            </div>
          </div>

          <p className="mt-4 mb-2 border-t border-line pt-3 font-mono text-[11px] uppercase tracking-wide text-ink-soft">
            Compra y vencimiento
          </p>

          <div className="mb-2 grid gap-2 sm:grid-cols-2">
            {/* Grid y no flex: Input y Select traen w-full en su clase base, que
                le gana a cualquier w-* de aquí. Como pista de grid, ese w-full
                pasa a ser el 100% de la pista y el ancho lo manda el track. */}
            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.price ?? ''}
                onChange={(e) => set('price', aNumero(e.target.value))}
                placeholder="Precio"
                aria-label="Precio"
              />
              <Select
                value={form.currency_code ?? ''}
                onChange={(e) => set('currency_code', e.target.value || null)}
                aria-label="Moneda"
                className="px-1.5"
              >
                <option value="">—</option>
                {MONEDAS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={form.size_value ?? ''}
                onChange={(e) => set('size_value', aNumero(e.target.value))}
                placeholder="Tamaño"
                aria-label="Tamaño"
              />
              <Select
                value={form.size_unit ?? ''}
                onChange={(e) => set('size_unit', e.target.value || null)}
                aria-label="Unidad"
                className="px-1.5"
              >
                <option value="">—</option>
                {UNIDADES.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </Select>
            </div>
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
            <Button variant="ghost" onClick={cerrar} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : editing ? 'Guardar cambios' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Collapse>

      {products.length === 0 ? (
        <EmptyState>Nada agregado todavía.</EmptyState>
      ) : (
        <div className="anim-lista">
          {products.map((p) => {
            const expanded = expandedId === p.id;
            const panelId = `producto-detalle-${p.id}`;
            const jerarquia = [p.brand, p.product_line].filter(Boolean).join(' · ');
            const compra = [
              formatearPrecio(p.price, p.currency_code),
              formatearTamano(p.size_value, p.size_unit),
              precioPorUnidad(p.price, p.currency_code, p.size_value, p.size_unit),
            ]
              .filter(Boolean)
              .join(' · ');

            return (
              <article
                key={p.id}
                className="mb-2 overflow-hidden rounded-[10px] border border-line bg-surface transition-colors hover:border-line-strong"
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => setExpandedId(expanded ? null : p.id)}
                    className="flex w-full cursor-pointer items-center gap-3 px-3.5 py-3 text-left
                      focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sage"
                  >
                    <Thumb
                      path={p.image_path}
                      alt=""
                      fallback={p.name}
                      placeholder
                      className="block size-14"
                    />

                    <span className="min-w-0 flex-1">
                      {jerarquia && (
                        <span className="block truncate font-mono text-[10px] uppercase tracking-wide text-ink-soft">
                          {jerarquia}
                        </span>
                      )}
                      <span className="mt-0.5 block text-sm font-medium leading-snug">{p.name}</span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <TimePill time={p.time_of_day} />
                        {p.frequency && (
                          <span className="font-mono text-[10px] text-ink-soft">{p.frequency}</span>
                        )}
                        {p.status !== 'Activo' && <StatusPill status={p.status} />}
                        <VencimientoPill producto={p} />
                      </span>
                    </span>

                    <ChevronDown
                      size={17}
                      strokeWidth={1.75}
                      aria-hidden
                      className={`shrink-0 text-ink-soft transition-transform duration-[260ms] ${
                        expanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </h3>

                <div
                  id={panelId}
                  aria-hidden={!expanded}
                  className={`grid transition-[grid-template-rows,opacity] duration-[260ms] ease-suave ${
                    expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div inert={!expanded} className="overflow-hidden">
                    <div className="border-t border-line px-3.5 pt-3 pb-3">
                      <CardMeta>{[p.category, compra].filter(Boolean).join(' · ')}</CardMeta>
                      {p.description && <CardMeta>{p.description}</CardMeta>}
                      {p.notes && <CardNotes>{p.notes}</CardNotes>}

                      {p.purchase_url && (
                        <a
                          href={p.purchase_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] text-sage-deep underline underline-offset-2 transition-colors hover:text-sage"
                        >
                          <ExternalLink size={11} strokeWidth={1.75} aria-hidden />
                          Dónde lo compré
                        </a>
                      )}

                      <div className="mt-3 flex justify-end gap-2 border-t border-line pt-3">
                        <Button variant="ghost" onClick={() => editar(p)}>
                          <Pencil size={13} strokeWidth={2} aria-hidden />
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar “${p.name}”?`)) deleteProduct(p.id);
                          }}
                        >
                          <X size={13} strokeWidth={2} aria-hidden />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
