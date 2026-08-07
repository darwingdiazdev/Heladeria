-- DEPRECATED: usar migrate-actualizar.sql
-- Este script dejaba fuera GASTO y fallaba si ya existían filas GASTO.
-- Se mantiene alineado con todos los tipos para no romper ejecuciones antiguas.

alter table public.movimientos drop constraint if exists movimientos_tipo_check;

alter table public.movimientos
  add constraint movimientos_tipo_check
  check (tipo in ('ENTRADA', 'SALIDA', 'CONSUMO_PERSONAL', 'AJUSTE', 'GASTO'));
