-- Añade compra_id para agrupar varias entradas en una factura de compra.
-- Ejecutar en Supabase → SQL Editor si la tabla ya existía.

alter table public.movimientos
  add column if not exists compra_id uuid;

create index if not exists movimientos_compra_id_idx
  on public.movimientos (compra_id);

-- Datos legacy: cada ENTRADA sin factura pasa a ser su propia compra
update public.movimientos
set compra_id = id
where tipo = 'ENTRADA'
  and compra_id is null;
