-- Tabla para marcar si el diezmo de una factura (compra_id) ya fue entregado.
-- Ejecutar en Supabase → SQL Editor.

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
