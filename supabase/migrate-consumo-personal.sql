-- Ejecutar en Supabase → SQL Editor si ya tenías las tablas creadas
-- (permite el tipo CONSUMO_PERSONAL en movimientos)

alter table public.movimientos drop constraint if exists movimientos_tipo_check;

alter table public.movimientos
  add constraint movimientos_tipo_check
  check (tipo in ('ENTRADA', 'SALIDA', 'CONSUMO_PERSONAL', 'AJUSTE'));
