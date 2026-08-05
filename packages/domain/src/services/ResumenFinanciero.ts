import { Dinero } from "../value-objects/Dinero.js";
import type { MovimientoInventario } from "../entities/MovimientoInventario.js";
import { TipoMovimiento } from "../entities/MovimientoInventario.js";

export interface ResumenFinancieroProps {
  totalIngresos: number;
  totalGanancia: number;
  totalDiezmo: number;
  gananciaNeta: number;
  unidadesVendidas: number;
  totalEntradas: number;
  totalSalidas: number;
  totalInversion: number;
  valorInventarioCosto: number;
  valorInventarioVenta: number;
}

/**
 * Objeto de valor / DTO de resumen financiero del inventario.
 */
export class ResumenFinanciero {
  readonly totalIngresos: Dinero;
  readonly totalGanancia: Dinero;
  readonly totalDiezmo: Dinero;
  readonly gananciaNeta: Dinero;
  readonly unidadesVendidas: number;
  readonly totalEntradas: number;
  readonly totalSalidas: number;
  readonly totalInversion: Dinero;
  readonly valorInventarioCosto: Dinero;
  readonly valorInventarioVenta: Dinero;

  constructor(props: ResumenFinancieroProps) {
    this.totalIngresos = Dinero.dePesos(props.totalIngresos);
    this.totalGanancia = Dinero.dePesos(props.totalGanancia);
    this.totalDiezmo = Dinero.dePesos(props.totalDiezmo);
    this.gananciaNeta = Dinero.dePesos(props.gananciaNeta);
    this.unidadesVendidas = props.unidadesVendidas;
    this.totalEntradas = props.totalEntradas;
    this.totalSalidas = props.totalSalidas;
    this.totalInversion = Dinero.dePesos(props.totalInversion);
    this.valorInventarioCosto = Dinero.dePesos(props.valorInventarioCosto);
    this.valorInventarioVenta = Dinero.dePesos(props.valorInventarioVenta);
  }

  static desdeMovimientos(
    movimientos: MovimientoInventario[],
    valorCosto: Dinero,
    valorVenta: Dinero
  ): ResumenFinanciero {
    let totalIngresos = Dinero.cero();
    let totalGanancia = Dinero.cero();
    let totalDiezmo = Dinero.cero();
    let totalInversion = Dinero.cero();
    let unidadesVendidas = 0;
    let totalEntradas = 0;
    let totalSalidas = 0;

    for (const m of movimientos) {
      if (m.tipo === TipoMovimiento.SALIDA) {
        // Venta: ingreso a precio de venta + ganancia/diezmo.
        totalIngresos = totalIngresos.sumar(m.ingreso);
        totalGanancia = totalGanancia.sumar(m.gananciaTotal);
        totalDiezmo = totalDiezmo.sumar(m.diezmo);
        unidadesVendidas += m.cantidad;
        totalSalidas += m.cantidad;
      } else if (m.tipo === TipoMovimiento.CONSUMO_PERSONAL) {
        // Consumo personal: se paga al costo (ingreso = costo), sin ganancia ni diezmo.
        totalIngresos = totalIngresos.sumar(m.ingreso);
        totalSalidas += m.cantidad;
      } else if (m.tipo === TipoMovimiento.ENTRADA) {
        totalEntradas += m.cantidad;
        totalInversion = totalInversion.sumar(m.gastoInversion);
      }
    }

    return new ResumenFinanciero({
      totalIngresos: totalIngresos.pesos,
      totalGanancia: totalGanancia.pesos,
      totalDiezmo: totalDiezmo.pesos,
      gananciaNeta: totalGanancia.restar(totalDiezmo).pesos,
      unidadesVendidas,
      totalEntradas,
      totalSalidas,
      totalInversion: totalInversion.pesos,
      valorInventarioCosto: valorCosto.pesos,
      valorInventarioVenta: valorVenta.pesos,
    });
  }

  toJSON(): ResumenFinancieroProps {
    return {
      totalIngresos: this.totalIngresos.pesos,
      totalGanancia: this.totalGanancia.pesos,
      totalDiezmo: this.totalDiezmo.pesos,
      gananciaNeta: this.gananciaNeta.pesos,
      unidadesVendidas: this.unidadesVendidas,
      totalEntradas: this.totalEntradas,
      totalSalidas: this.totalSalidas,
      totalInversion: this.totalInversion.pesos,
      valorInventarioCosto: this.valorInventarioCosto.pesos,
      valorInventarioVenta: this.valorInventarioVenta.pesos,
    };
  }
}
