-- Datos de compra y vencimiento en productos
--
-- Nota sobre las fechas: en cosmética el vencimiento que importa rara vez es el
-- impreso. El PAO (Period After Opening, el símbolo del tarrito con "6M" o
-- "12M") empieza a contar al abrir el envase, y para un activo inestable como
-- un retinal ese es el plazo real. `opened_at` ya existía desde 001 sin usarse:
-- junto con `pao_months` es lo que permite calcularlo.

alter table public.products
  add column if not exists brand         text,
  add column if not exists purchase_url  text,
  add column if not exists size_ml       numeric,
  add column if not exists pao_months    integer,
  add column if not exists expires_at    date,
  -- null = todavía sin decidir, que es distinto de "no lo repetiría"
  add column if not exists repurchase    boolean;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_pao_months_check') then
    alter table public.products add constraint products_pao_months_check
      check (pao_months is null or (pao_months > 0 and pao_months <= 60));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'products_size_ml_check') then
    alter table public.products add constraint products_size_ml_check
      check (size_ml is null or size_ml > 0);
  end if;
end $$;

comment on column public.products.size_ml is
  'Contenido en ml (o g, que para efectos de comparar precio por unidad es equivalente).';
comment on column public.products.pao_months is
  'Meses de vida útil una vez abierto. Se combina con opened_at.';
comment on column public.products.repurchase is
  'Si volvería a comprarlo. null mientras no lo haya decidido.';
