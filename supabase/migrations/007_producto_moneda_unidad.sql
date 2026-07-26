-- Moneda del precio y unidad del tamaño
--
-- `size_ml` asumía que ml y g eran intercambiables para comparar precio. No lo
-- son: son magnitudes distintas. Se separa en cantidad + unidad, y el precio
-- gana la moneda que hasta ahora estaba implícita.

alter table public.products
  add column if not exists currency_code text,
  add column if not exists size_value    numeric,
  add column if not exists size_unit     text;

-- Traslado de size_ml. Idempotente: solo toca filas que aún no tienen
-- size_value, así que volver a correr esto no pisa nada editado después.
update public.products
set size_value = size_ml,
    size_unit  = 'ml'
where size_ml is not null
  and size_value is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_currency_code_check') then
    alter table public.products add constraint products_currency_code_check
      check (currency_code is null or currency_code ~ '^[A-Z]{3}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'products_size_value_check') then
    alter table public.products add constraint products_size_value_check
      check (size_value is null or size_value > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'products_size_unit_check') then
    alter table public.products add constraint products_size_unit_check
      check (size_unit is null or size_unit in ('ml', 'g', 'unidad'));
  end if;

  -- Un tamaño sin unidad no significa nada. El traslado de arriba garantiza que
  -- ninguna fila existente lo incumpla, así que se puede validar de una.
  if not exists (select 1 from pg_constraint where conname = 'products_size_unit_requerida_check') then
    alter table public.products add constraint products_size_unit_requerida_check
      check (size_value is null or size_unit is not null);
  end if;

  -- NOT VALID a propósito: se exige en cada insert y update, pero no se revisan
  -- las filas ya existentes. Un producto anterior a esta migración puede tener
  -- precio sin moneda, y adivinarle una sería peor que dejarlo sin dato.
  -- Al editarlo, la restricción lo obliga a completarla.
  if not exists (select 1 from pg_constraint where conname = 'products_currency_con_precio_check') then
    alter table public.products add constraint products_currency_con_precio_check
      check (price is null or currency_code is not null) not valid;
  end if;
end $$;

comment on column public.products.currency_code is
  'Código ISO 4217 de tres letras. Obligatorio si hay precio (ver constraint NOT VALID).';
comment on column public.products.size_value is
  'Cantidad del envase. La unidad va en size_unit.';
comment on column public.products.size_unit is
  'ml, g o unidad. Obligatoria si hay size_value.';
comment on column public.products.size_ml is
  'OBSOLETA desde 007: trasladada a size_value + size_unit. La app ya no la lee ni la escribe. '
  'Se conserva como respaldo del traslado; se puede eliminar cuando esté confirmado.';
