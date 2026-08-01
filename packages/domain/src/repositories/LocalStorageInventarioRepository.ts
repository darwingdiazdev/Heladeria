import { Helado, type HeladoProps } from "../entities/Helado.js";
import {
  MovimientoInventario,
  type MovimientoProps,
} from "../entities/MovimientoInventario.js";
import type { IInventarioRepository } from "./IInventarioRepository.js";

interface Persistencia {
  helados: HeladoProps[];
  movimientos: MovimientoProps[];
}

/**
 * Adaptador: repositorio en memoria + localStorage (navegador).
 * Útil como fallback si no hay credenciales de Supabase.
 */
export class LocalStorageInventarioRepository implements IInventarioRepository {
  private readonly clave: string;
  private cache: Persistencia | null = null;

  constructor(clave = "inventario-helados-v1") {
    this.clave = clave;
  }

  async listarHelados(): Promise<Helado[]> {
    return this.cargar().helados.map((h) => Helado.desdeJSON(h));
  }

  async obtenerHelado(id: string): Promise<Helado | null> {
    const props = this.cargar().helados.find((h) => h.id === id);
    return props ? Helado.desdeJSON(props) : null;
  }

  async guardarHelado(helado: Helado): Promise<void> {
    const data = this.cargar();
    const idx = data.helados.findIndex((h) => h.id === helado.id);
    const json = helado.toJSON();
    if (idx >= 0) {
      data.helados[idx] = json;
    } else {
      data.helados.push(json);
    }
    this.guardar(data);
  }

  async eliminarHelado(id: string): Promise<void> {
    const data = this.cargar();
    data.helados = data.helados.filter((h) => h.id !== id);
    this.guardar(data);
  }

  async listarMovimientos(): Promise<MovimientoInventario[]> {
    return this.cargar().movimientos.map((m) =>
      MovimientoInventario.desdeJSON(m)
    );
  }

  async guardarMovimiento(movimiento: MovimientoInventario): Promise<void> {
    const data = this.cargar();
    data.movimientos.push(movimiento.toJSON());
    this.guardar(data);
  }

  async limpiarTodo(): Promise<void> {
    this.cache = { helados: [], movimientos: [] };
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(this.clave);
    }
  }

  private cargar(): Persistencia {
    if (this.cache) return this.cache;

    const vacio: Persistencia = { helados: [], movimientos: [] };

    if (typeof localStorage === "undefined") {
      this.cache = vacio;
      return vacio;
    }

    try {
      const raw = localStorage.getItem(this.clave);
      if (!raw) {
        this.cache = vacio;
        return vacio;
      }
      const parsed = JSON.parse(raw) as Persistencia;
      this.cache = {
        helados: parsed.helados ?? [],
        movimientos: parsed.movimientos ?? [],
      };
      return this.cache;
    } catch {
      this.cache = vacio;
      return vacio;
    }
  }

  private guardar(data: Persistencia): void {
    this.cache = data;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(this.clave, JSON.stringify(data));
    }
  }
}
