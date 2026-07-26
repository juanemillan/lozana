-- Fase 7 — Autenticación y RLS real
--
-- Antes de esto, las 6 tablas de datos eran legibles y escribibles con la anon key
-- desde cualquier navegador. Acá se cierra eso.
--
-- El orden respecto al registro del usuario da casi lo mismo. Si corrés esto
-- primero, el backfill del bloque 3 no encuentra a quién asignarle las filas que
-- ya existían y quedan con user_id NULL (invisibles bajo RLS). Para eso está
-- 003_backfill_user_id.sql, que se corre después de registrarse y arregla eso.

-- ---------------------------------------------------------------------------
-- 1. public.users pasa a ser tabla de perfil colgada de auth.users
--    Su id deja de ser aleatorio y pasa a ser el mismo de auth.users, que es lo
--    que devuelve auth.uid(). Sin esto, `auth.uid() = user_id` nunca daría true.
-- ---------------------------------------------------------------------------

alter table public.users alter column id drop default;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_id_fkey' and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_id_fkey
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Perfil automático al registrarse
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Perfil para el usuario que ya exista (el trigger solo cubre los nuevos)
insert into public.users (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. user_id se completa solo, y se rellenan las filas viejas
--    El default hace que un insert desde el cliente no pueda "olvidarse" del
--    user_id ni falsificarlo: lo pone Postgres leyendo el JWT.
-- ---------------------------------------------------------------------------

do $$
declare
  t         text;
  owner_id  uuid;
  huerfanas bigint;
begin
  select id into owner_id from auth.users order by created_at limit 1;

  foreach t in array array['products','foods','exercises','checklist_entries','photos','log_entries']
  loop
    execute format('alter table public.%I alter column user_id set default auth.uid()', t);

    if owner_id is not null then
      execute format('update public.%I set user_id = $1 where user_id is null', t) using owner_id;
    end if;

    -- NOT NULL solo si no queda ninguna huérfana, para no abortar la migración
    execute format('select count(*) from public.%I where user_id is null', t) into huerfanas;
    if huerfanas = 0 then
      execute format('alter table public.%I alter column user_id set not null', t);
    else
      raise notice '% conserva % fila(s) con user_id NULL: quedan invisibles bajo RLS', t, huerfanas;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 4. RLS: se borra toda policy previa (incluidas las "allow all" temporales)
--    y se reemplaza por uso propio. `to authenticated` deja a anon sin nada.
--    `(select auth.uid())` se evalúa una vez por sentencia y no una vez por fila.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  p record;
begin
  foreach t in array array['products','foods','exercises','checklist_entries','photos','log_entries','users']
  loop
    execute format('alter table public.%I enable row level security', t);

    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
  end loop;

  -- Las 6 tablas de datos: dueño vía user_id
  foreach t in array array['products','foods','exercises','checklist_entries','photos','log_entries']
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      t || '_delete_own', t);
  end loop;
end $$;

-- El perfil se identifica por id, no por user_id. Sin policy de insert: lo crea
-- el trigger, que es security definer. Sin delete: eso lo maneja auth.users.
create policy users_select_own on public.users
  for select to authenticated using ((select auth.uid()) = id);

create policy users_update_own on public.users
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
