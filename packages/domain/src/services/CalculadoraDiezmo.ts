import { Dinero } from "../value-objects/Dinero.js";

/**
 * Servicio de dominio: calcula el diezmo (10% de la ganancia).
 * Solo aplica a salidas por venta; consumo personal y otros tipos no lo usan.
 */
export class CalculadoraDiezmo {
  static readonly PORCENTAJE = 10;

  /** Diezmo sobre la ganancia de una venta. Si la ganancia no es positiva, retorna 0. */
  calcular(ganancia: Dinero): Dinero {
    if (ganancia.pesos <= 0) {
      return Dinero.cero();
    }
    return ganancia.porcentaje(CalculadoraDiezmo.PORCENTAJE);
  }

  gananciaNetaTrasDiezmo(ganancia: Dinero): Dinero {
    return ganancia.restar(this.calcular(ganancia));
  }
}
