-- Migración segura para bases que YA existen.
-- Ejecutar SOLO este archivo en Supabase → SQL Editor → Run.
-- No mezcles scripts viejos (migrate-consumo-personal sin GASTO falla si ya hay filas GASTO).

-- 1) Tipos de movimiento permitidos (incluye todos)
alter table public.movimientos drop constraint if exists movimientos_tipo_check;

alter table public.movimientos
  add constraint movimientos_tipo_check
  check (tipo in ('ENTRADA', 'SALIDA', 'CONSUMO_PERSONAL', 'AJUSTE', 'GASTO'));

-- 2) Gastos sin helado
alter table public.movimientos
  alter column helado_id drop not null;

-- 3) Facturas de compra (varios helados = mismo compra_id)
alter table public.movimientos
  add column if not exists compra_id uuid;

create index if not exists movimientos_compra_id_idx
  on public.movimientos (compra_id);

update public.movimientos
set compra_id = id
where tipo = 'ENTRADA'
  and compra_id is null;

-- 4) Check de diezmo entregado por factura
create table if not exists public.diezmos_compra (
  compra_id uuid primary key,
  entregado boolean not null default true,
  actualizado_en timestamptz not null default now()
);

alter table public.diezmos_compra enable row level security;

drop policy if exists "diezmos_compra_all_anon" on public.diezmos_compra;
create policy "diezmos_compra_all_anon"
  on public.diezmos_compra
  for all
  to anon, authenticated
  using (true)
  with check (true);
