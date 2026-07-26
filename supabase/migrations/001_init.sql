-- Extensión para generar UUIDs
create extension if not exists "uuid-ossp";

-- Usuarios (Supabase ya maneja auth.users, esta tabla es tu perfil extendido)
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  created_at timestamp with time zone default now()
);

-- Productos
create table products (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  category text not null,
  time_of_day text not null,
  frequency text,
  status text default 'Activo',
  image_url text,
  opened_at date,
  notes text,
  created_at timestamp with time zone default now()
);

-- Checklist diario (une usuario + producto + fecha)
create table checklist_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  entry_date date not null,
  done_am boolean default false,
  done_pm boolean default false,
  unique(user_id, product_id, entry_date)
);

-- Fotos (productos o progreso)
create table photos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  taken_at date default current_date,
  image_url text not null,
  tag text
);

-- Bitácora
create table log_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  entry_date date not null,
  text text not null
);

-- Agregado: descripción y precio en productos
alter table products add column description text;
alter table products add column price numeric;

-- Agregado: tabla de alimentos y ejercicios
create table foods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  category text,
  frequency text,
  notes text,
  created_at timestamp with time zone default now()
);

-- Agregado: tabla de ejercicios
create table exercises (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  frequency text,
  notes text,
  created_at timestamp with time zone default now()
);