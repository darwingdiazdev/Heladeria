import { Dinero } from "../value-objects/Dinero.js";

/**
 * Servicio de dominio: calcula el diezmo (10% de la utilidad).
 * Utilidad = ingresos por ventas − inversión.
 * Solo aplica cuando la utilidad es positiva.
 */
export class CalculadoraDiezmo {
  static readonly PORCENTAJE = 10;

  /** Diezmo sobre la utilidad. Si no es positiva, retorna 0. */
  calcular(utilidad: Dinero): Dinero {
    if (utilidad.pesos <= 0) {
      return Dinero.cero();
    }
    return utilidad.porcentaje(CalculadoraDiezmo.PORCENTAJE);
  }

  utilidadNetaTrasDiezmo(utilidad: Dinero): Dinero {
    return utilidad.restar(this.calcular(utilidad));
  }
}
