-- Backfill de user_id — correr DESPUÉS de que exista el usuario.
--
-- 002 ya deja todo cerrado, pero si lo corriste antes de registrarte, las filas
-- que ya existían quedaron con user_id NULL y por lo tanto invisibles bajo RLS.
-- Esto se las asigna al primer usuario y termina de aplicar el NOT NULL que 002
-- salteó en las tablas que tenían huérfanas.
--
-- Es idempotente: si no quedan huérfanas no hace nada.

do $$
declare
  t         text;
  owner_id  uuid;
  huerfanas bigint;
  tocadas   bigint;
begin
  select id into owner_id from auth.users order by created_at limit 1;

  if owner_id is null then
    raise exception 'No hay ningún usuario en auth.users. Registrate primero y volvé a correr esto.';
  end if;

  foreach t in array array['products','foods','exercises','checklist_entries','photos','log_entries']
  loop
    execute format('update public.%I set user_id = $1 where user_id is null', t) using owner_id;
    get diagnostics tocadas = row_count;

    if tocadas > 0 then
      raise notice '%: % fila(s) asignadas', t, tocadas;
    end if;

    execute format('select count(*) from public.%I where user_id is null', t) into huerfanas;
    if huerfanas = 0 then
      execute format('alter table public.%I alter column user_id set not null', t);
    end if;
  end loop;
end $$;
