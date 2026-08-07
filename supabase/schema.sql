-- Inventario de Helados — esquema Supabase / Postgres
-- Ejecutar en: Supabase → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

create table if not exists public.helados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  sabor text not null default '',
  precio_costo numeric(14, 2) not null check (precio_costo >= 0),
  precio_venta numeric(14, 2) not null check (precio_venta >= 0),
  stock integer not null default 0 check (stock >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint helados_venta_gte_costo check (precio_venta >= precio_costo)
);

create table if not exists public.movimientos (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: gastos de inversión (cartel, cucharas…) no van ligados a un helado
  helado_id uuid references public.helados (id) on delete cascade,
  helado_nombre text not null,
  tipo text not null check (tipo in ('ENTRADA', 'SALIDA', 'CONSUMO_PERSONAL', 'AJUSTE', 'GASTO')),
  cantidad integer not null check (cantidad >= 0),
  stock_anterior integer not null,
  stock_nuevo integer not null,
  precio_costo_unitario numeric(14, 2) not null,
  precio_venta_unitario numeric(14, 2) not null,
  ganancia_total numeric(14, 2) not null default 0,
  diezmo numeric(14, 2) not null default 0,
  nota text not null default '',
  fecha timestamptz not null default now()
);

create index if not exists movimientos_fecha_idx on public.movimientos (fecha desc);
create index if not exists movimientos_helado_id_idx on public.movimientos (helado_id);
create index if not exists helados_activo_idx on public.helados (activo);

-- Acceso público con la anon key (app personal / sin login).
-- Si más adelante agregas autenticación, restringe estas policies.
alter table public.helados enable row level security;
alter table public.movimientos enable row level security;

drop policy if exists "helados_all_anon" on public.helados;
create policy "helados_all_anon"
  on public.helados
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "movimientos_all_anon" on public.movimientos;
create policy "movimientos_all_anon"
  on public.movimientos
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Si ya creaste las tablas antes, ejecuta también migrate-consumo-personal.sql
-- y migrate-gasto.sql (GASTO + helado_id nullable).
