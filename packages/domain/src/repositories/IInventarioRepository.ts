import type { Helado } from "../entities/Helado.js";
import type { MovimientoInventario } from "../entities/MovimientoInventario.js";

/**
 * Puerto (interface) del repositorio de inventario.
 * Async para soportar Supabase / APIs remotas.
 */
export interface IInventarioRepository {
  listarHelados(): Promise<Helado[]>;
  obtenerHelado(id: string): Promise<Helado | null>;
  guardarHelado(helado: Helado): Promise<void>;
  eliminarHelado(id: string): Promise<void>;
  listarMovimientos(): Promise<MovimientoInventario[]>;
  guardarMovimiento(movimiento: MovimientoInventario): Promise<void>;
  limpiarTodo(): Promise<void>;
}
