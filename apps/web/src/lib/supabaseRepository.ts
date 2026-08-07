import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  Helado,
  MovimientoInventario,
  TipoMovimiento,
  type IInventarioRepository,
} from "@inventario/domain";

interface HeladoRow {
  id: string;
  nombre: string;
  sabor: string;
  precio_costo: number | string;
  precio_venta: number | string;
  stock: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

interface MovimientoRow {
  id: string;
  helado_id: string | null;
  helado_nombre: string;
  tipo: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  precio_costo_unitario: number | string;
  precio_venta_unitario: number | string;
  ganancia_total: number | string;
  diezmo: number | string;
  nota: string;
  fecha: string;
  compra_id?: string | null;
}

function num(v: number | string): number {
  return typeof v === "number" ? v : Number(v);
}

function mapHelado(row: HeladoRow): Helado {
  return Helado.desdeJSON({
    id: row.id,
    nombre: row.nombre,
    sabor: row.sabor,
    precioCosto: num(row.precio_costo),
    precioVenta: num(row.precio_venta),
    stock: row.stock,
    activo: row.activo,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  });
}

function mapMovimiento(row: MovimientoRow): MovimientoInventario {
  return MovimientoInventario.desdeJSON({
    id: row.id,
    heladoId: row.helado_id ?? "",
    heladoNombre: row.helado_nombre,
    tipo: row.tipo as TipoMovimiento,
    cantidad: row.cantidad,
    stockAnterior: row.stock_anterior,
    stockNuevo: row.stock_nuevo,
    precioCostoUnitario: num(row.precio_costo_unitario),
    precioVentaUnitario: num(row.precio_venta_unitario),
    gananciaTotal: num(row.ganancia_total),
    diezmo: num(row.diezmo),
    nota: row.nota,
    fecha: row.fecha,
    compraId: row.compra_id ?? undefined,
  });
}

/**
 * Adaptador Supabase: implementa IInventarioRepository contra Postgres.
 */
export class SupabaseInventarioRepository implements IInventarioRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listarHelados(): Promise<Helado[]> {
    const { data, error } = await this.client
      .from("helados")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) throw new Error(`Error al listar helados: ${error.message}`);
    return (data as HeladoRow[]).map(mapHelado);
  }

  async obtenerHelado(id: string): Promise<Helado | null> {
    const { data, error } = await this.client
      .from("helados")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`Error al obtener helado: ${error.message}`);
    return data ? mapHelado(data as HeladoRow) : null;
  }

  async guardarHelado(helado: Helado): Promise<void> {
    const json = helado.toJSON();
    const { error } = await this.client.from("helados").upsert({
      id: json.id,
      nombre: json.nombre,
      sabor: json.sabor,
      precio_costo: json.precioCosto,
      precio_venta: json.precioVenta,
      stock: json.stock,
      activo: json.activo,
      creado_en: json.creadoEn,
      actualizado_en: json.actualizadoEn ?? new Date().toISOString(),
    });

    if (error) throw new Error(`Error al guardar helado: ${error.message}`);
  }

  async eliminarHelado(id: string): Promise<void> {
    const { error } = await this.client.from("helados").delete().eq("id", id);
    if (error) throw new Error(`Error al eliminar helado: ${error.message}`);
  }

  async listarMovimientos(): Promise<MovimientoInventario[]> {
    const { data, error } = await this.client
      .from("movimientos")
      .select("*")
      .order("fecha", { ascending: false });

    if (error) throw new Error(`Error al listar movimientos: ${error.message}`);
    return (data as MovimientoRow[]).map(mapMovimiento);
  }

  async guardarMovimiento(movimiento: MovimientoInventario): Promise<void> {
    const json = movimiento.toJSON();
    const { error } = await this.client.from("movimientos").insert({
      id: json.id,
      helado_id: json.heladoId || null,
      helado_nombre: json.heladoNombre,
      tipo: json.tipo,
      cantidad: json.cantidad,
      stock_anterior: json.stockAnterior,
      stock_nuevo: json.stockNuevo,
      precio_costo_unitario: json.precioCostoUnitario,
      precio_venta_unitario: json.precioVentaUnitario,
      ganancia_total: json.gananciaTotal,
      diezmo: json.diezmo,
      nota: json.nota ?? "",
      fecha: json.fecha,
      compra_id: json.compraId ?? null,
    });

    if (error) throw new Error(`Error al guardar movimiento: ${error.message}`);
  }

  async actualizarMovimiento(movimiento: MovimientoInventario): Promise<void> {
    const json = movimiento.toJSON();
    const { error } = await this.client
      .from("movimientos")
      .update({
        helado_id: json.heladoId || null,
        helado_nombre: json.heladoNombre,
        tipo: json.tipo,
        cantidad: json.cantidad,
        stock_anterior: json.stockAnterior,
        stock_nuevo: json.stockNuevo,
        precio_costo_unitario: json.precioCostoUnitario,
        precio_venta_unitario: json.precioVentaUnitario,
        ganancia_total: json.gananciaTotal,
        diezmo: json.diezmo,
        nota: json.nota ?? "",
        fecha: json.fecha,
        compra_id: json.compraId ?? null,
      })
      .eq("id", json.id);

    if (error) {
      throw new Error(`Error al actualizar movimiento: ${error.message}`);
    }
  }

  async listarDiezmosEntregados(): Promise<string[]> {
    const { data, error } = await this.client
      .from("diezmos_compra")
      .select("compra_id")
      .eq("entregado", true);

    if (error) {
      throw new Error(`Error al listar diezmos: ${error.message}`);
    }
    return (data ?? []).map((row: { compra_id: string }) => row.compra_id);
  }

  async guardarDiezmoEntregado(
    compraId: string,
    entregado: boolean
  ): Promise<void> {
    if (!entregado) {
      const { error } = await this.client
        .from("diezmos_compra")
        .delete()
        .eq("compra_id", compraId);
      if (error) {
        throw new Error(`Error al quitar diezmo: ${error.message}`);
      }
      return;
    }

    const { error } = await this.client.from("diezmos_compra").upsert({
      compra_id: compraId,
      entregado: true,
      actualizado_en: new Date().toISOString(),
    });
    if (error) {
      throw new Error(`Error al marcar diezmo: ${error.message}`);
    }
  }

  async limpiarTodo(): Promise<void> {
    const { error: e0 } = await this.client
      .from("diezmos_compra")
      .delete()
      .neq("compra_id", "00000000-0000-0000-0000-000000000000");
    if (e0) throw new Error(`Error al limpiar diezmos: ${e0.message}`);

    const { error: e1 } = await this.client
      .from("movimientos")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (e1) throw new Error(`Error al limpiar movimientos: ${e1.message}`);

    const { error: e2 } = await this.client
      .from("helados")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (e2) throw new Error(`Error al limpiar helados: ${e2.message}`);
  }
}

export function crearClienteSupabase(
  url: string,
  anonKey: string
): SupabaseClient {
  return createClient(url, anonKey);
}

export function hayCredencialesSupabase(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("TU_PROYECTO"));
}
