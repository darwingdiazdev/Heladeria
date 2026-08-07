import { useCallback, useEffect, useState } from "react";
import type {
  ActualizarHeladoDTO,
  CrearHeladoDTO,
  EditarMovimientoDTO,
  Helado,
  MovimientoInventario,
  RegistrarCompraDTO,
  RegistrarMovimientoDTO,
  ResumenFinanciero,
} from "@inventario/domain";
import {
  inventarioService,
  modoPersistencia,
  resumenVacio,
} from "../lib/inventario";

export function useInventario() {
  const [helados, setHelados] = useState<Helado[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [resumen, setResumen] = useState<ResumenFinanciero>(resumenVacio);
  const [diezmosEntregados, setDiezmosEntregados] = useState<Set<string>>(
    () => new Set()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    const [listaHelados, listaMovimientos, resumenActual, diezmos] =
      await Promise.all([
        inventarioService.listarHelados(true),
        inventarioService.listarMovimientos(),
        inventarioService.obtenerResumen(),
        inventarioService.listarDiezmosEntregados(),
      ]);
    setHelados(listaHelados);
    setMovimientos(listaMovimientos);
    setResumen(resumenActual);
    setDiezmosEntregados(new Set(diezmos));
  }, []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        setLoading(true);
        await refrescar();
        if (vivo) setErr(null);
      } catch (e) {
        if (vivo) {
          setErr(e instanceof Error ? e.message : "Error al cargar datos");
        }
      } finally {
        if (vivo) setLoading(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [refrescar]);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        setSaving(true);
        const result = await fn();
        await refrescar();
        setErr(null);
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error inesperado";
        setErr(msg);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [refrescar]
  );

  const limpiarError = useCallback(() => setErr(null), []);

  return {
    helados,
    movimientos,
    resumen,
    diezmosEntregados,
    loading,
    saving,
    error,
    modoPersistencia,
    limpiarError,
    agregarHelado: (dto: CrearHeladoDTO) =>
      run(() => inventarioService.agregarHelado(dto)),
    editarHelado: (id: string, dto: ActualizarHeladoDTO) =>
      run(() => inventarioService.editarHelado(id, dto)),
    eliminarHelado: (id: string) =>
      run(async () => {
        await inventarioService.eliminarHelado(id);
      }),
    registrarCompra: (dto: RegistrarCompraDTO) =>
      run(() => inventarioService.registrarCompra(dto)),
    registrarMovimiento: (dto: RegistrarMovimientoDTO) =>
      run(() => inventarioService.registrarMovimiento(dto)),
    editarMovimiento: (id: string, dto: EditarMovimientoDTO) =>
      run(() => inventarioService.editarMovimiento(id, dto)),
    marcarDiezmoEntregado: (compraId: string, entregado: boolean) =>
      run(async () => {
        await inventarioService.marcarDiezmoEntregado(compraId, entregado);
      }),
  };
}
