-- Fase 7b — Perfil de usuario + cierre del bucket de fotos
--
-- Correr DESPUÉS de 002. Agrega los campos de perfil que alimentan el onboarding
-- (y más adelante el contexto que reciba Claude), y cierra el bucket `photos`,
-- que hasta ahora era público.

-- ---------------------------------------------------------------------------
-- 1. Campos de perfil sobre public.users
--    Nombres en inglés como el resto del esquema; las etiquetas van en la UI.
-- ---------------------------------------------------------------------------

alter table public.users
  add column if not exists full_name              text,
  add column if not exists age_range              text,
  add column if not exists skin_type              text,
  add column if not exists concerns               text[] not null default '{}',
  add column if not exists sensitivities          text,
  add column if not exists goal                   text,
  add column if not exists avatar_path            text,
  add column if not exists onboarding_completed_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_age_range_check') then
    alter table public.users add constraint users_age_range_check
      check (age_range is null or age_range in ('18-24','25-34','35-44','45-54','55+'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'users_skin_type_check') then
    alter table public.users add constraint users_skin_type_check
      check (skin_type is null or skin_type in ('Seca','Mixta','Grasa','Normal','Sensible'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. products.image_url pasa a guardar un path de Storage, no una URL pública
--    Con el bucket privado ya no hay URL estable que guardar: se firma al leer.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'image_url'
  ) then
    alter table public.products rename column image_url to image_path;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Bucket privado + policies por carpeta de usuario
--    Convención de path: {user_id}/{carpeta}/{archivo}
--    storage.foldername(name)[1] es el primer segmento, o sea el user_id.
-- ---------------------------------------------------------------------------

update storage.buckets set public = false where id = 'photos';

-- Borra cualquier policy previa que mencione este bucket (las permisivas que
-- hayan quedado del dashboard incluidas). Las policies se combinan con OR, así
-- que dejar una permisiva viva anularía todo lo de abajo.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') ilike '%photos%' or coalesce(with_check, '') ilike '%photos%')
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

create policy photos_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy photos_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy photos_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy photos_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
