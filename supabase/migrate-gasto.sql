-- Ejecutar en Supabase → SQL Editor si ya tenías las tablas creadas
-- (permite tipo GASTO y helado_id nulo para inversiones extra)

alter table public.movimientos drop constraint if exists movimientos_tipo_check;

alter table public.movimientos
  add constraint movimientos_tipo_check
  check (tipo in ('ENTRADA', 'SALIDA', 'CONSUMO_PERSONAL', 'AJUSTE', 'GASTO'));

alter table public.movimientos
  alter column helado_id drop not null;
