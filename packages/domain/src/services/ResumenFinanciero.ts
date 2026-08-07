import { Dinero } from "../value-objects/Dinero.js";
import type { MovimientoInventario } from "../entities/MovimientoInventario.js";
import { TipoMovimiento } from "../entities/MovimientoInventario.js";
import { CalculadoraDiezmo } from "./CalculadoraDiezmo.js";

export interface ResumenLineaCompraProps {
  heladoId: string;
  heladoNombre: string;
  unidadesCompradas: number;
  unidadesVendidas: number;
  unidadesRestantes: number;
  inversion: number;
  ingresos: number;
}

export interface ResumenExtraCompraProps {
  concepto: string;
  monto: number;
}

export interface ResumenCompraProps {
  compraId: string;
  numero: number;
  fecha: string;
  /** Nombres de helados de la factura, separados. */
  detalle: string;
  lineas: ResumenLineaCompraProps[];
  extras: ResumenExtraCompraProps[];
  unidadesCompradas: number;
  unidadesVendidas: number;
  unidadesRestantes: number;
  inversion: number;
  ingresos: number;
  utilidad: number;
  diezmo: number;
  nota?: string;
}

/**
 * Resumen de una compra/factura (puede incluir varios helados):
 * utilidad = ingresos atribuidos − inversión; diezmo = 10% de utilidad si > 0.
 */
export class ResumenCompra {
  readonly compraId: string;
  readonly numero: number;
  readonly fecha: Date;
  readonly detalle: string;
  readonly lineas: ResumenLineaCompraProps[];
  readonly extras: ResumenExtraCompraProps[];
  readonly unidadesCompradas: number;
  readonly unidadesVendidas: number;
  readonly unidadesRestantes: number;
  readonly inversion: Dinero;
  readonly ingresos: Dinero;
  readonly utilidad: Dinero;
  readonly diezmo: Dinero;
  readonly nota: string;

  constructor(props: ResumenCompraProps) {
    this.compraId = props.compraId;
    this.numero = props.numero;
    this.fecha = new Date(props.fecha);
    this.detalle = props.detalle;
    this.lineas = props.lineas;
    this.extras = props.extras ?? [];
    this.unidadesCompradas = props.unidadesCompradas;
    this.unidadesVendidas = props.unidadesVendidas;
    this.unidadesRestantes = props.unidadesRestantes;
    this.inversion = Dinero.dePesos(props.inversion);
    this.ingresos = Dinero.dePesos(props.ingresos);
    this.utilidad = Dinero.dePesos(props.utilidad);
    this.diezmo = Dinero.dePesos(props.diezmo);
    this.nota = props.nota ?? "";
  }

  get etiqueta(): string {
    return `Compra ${this.numero}`;
  }

  toJSON(): ResumenCompraProps {
    return {
      compraId: this.compraId,
      numero: this.numero,
      fecha: this.fecha.toISOString(),
      detalle: this.detalle,
      lineas: this.lineas,
      extras: this.extras,
      unidadesCompradas: this.unidadesCompradas,
      unidadesVendidas: this.unidadesVendidas,
      unidadesRestantes: this.unidadesRestantes,
      inversion: this.inversion.pesos,
      ingresos: this.ingresos.pesos,
      utilidad: this.utilidad.pesos,
      diezmo: this.diezmo.pesos,
      nota: this.nota,
    };
  }
}

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
  compras?: ResumenCompraProps[];
}

/** Lote FIFO = una línea de una factura (entrada de un helado). */
interface LoteLinea {
  compraId: string;
  heladoId: string;
  heladoNombre: string;
  fecha: Date;
  unidadesCompradas: number;
  restante: number;
  inversion: number;
  ingresos: number;
  unidadesVendidas: number;
  nota: string;
}

/**
 * Resumen financiero.
 * Lógica A: utilidad = ingresos (ventas) − inversión; diezmo = 10% de esa utilidad.
 */
export class ResumenFinanciero {
  readonly totalIngresos: Dinero;
  /** Utilidad = ingresos − inversión (puede ser negativa). */
  readonly totalGanancia: Dinero;
  readonly totalDiezmo: Dinero;
  readonly gananciaNeta: Dinero;
  readonly unidadesVendidas: number;
  readonly totalEntradas: number;
  readonly totalSalidas: number;
  readonly totalInversion: Dinero;
  readonly valorInventarioCosto: Dinero;
  readonly valorInventarioVenta: Dinero;
  readonly compras: ResumenCompra[];

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
    this.compras = (props.compras ?? []).map((c) => new ResumenCompra(c));
  }

  static desdeMovimientos(
    movimientos: MovimientoInventario[],
    valorCosto: Dinero,
    valorVenta: Dinero,
    /**
     * Historial completo para atribuir ventas a compras (FIFO).
     * Si no se pasa, se usa `movimientos` (puede ser solo el periodo).
     */
    historialParaCompras?: MovimientoInventario[]
  ): ResumenFinanciero {
    const calculadora = new CalculadoraDiezmo();
    let totalIngresos = Dinero.cero();
    let totalInversion = Dinero.cero();
    let unidadesVendidas = 0;
    let totalEntradas = 0;
    let totalSalidas = 0;

    for (const m of movimientos) {
      if (m.tipo === TipoMovimiento.SALIDA) {
        totalIngresos = totalIngresos.sumar(m.ingreso);
        unidadesVendidas += m.cantidad;
        totalSalidas += m.cantidad;
      } else if (m.tipo === TipoMovimiento.CONSUMO_PERSONAL) {
        totalSalidas += m.cantidad;
      } else if (m.tipo === TipoMovimiento.ENTRADA) {
        totalEntradas += m.cantidad;
        totalInversion = totalInversion.sumar(m.gastoInversion);
      } else if (m.tipo === TipoMovimiento.GASTO) {
        totalInversion = totalInversion.sumar(m.gastoInversion);
      }
    }

    const utilidadPesos = totalIngresos.pesos - totalInversion.pesos;
    const baseDiezmo =
      utilidadPesos > 0 ? Dinero.dePesos(utilidadPesos) : Dinero.cero();
    const totalDiezmo = calculadora.calcular(baseDiezmo);
    const gananciaNetaPesos = utilidadPesos - totalDiezmo.pesos;

    const historial = historialParaCompras ?? movimientos;
    const comprasTodas = ResumenFinanciero.resumenesPorCompra(historial);
    const facturasPeriodo = new Set(
      movimientos
        .filter((m) => m.tipo === TipoMovimiento.ENTRADA)
        .map((m) => m.facturaId)
    );
    const compras =
      historialParaCompras !== undefined
        ? comprasTodas.filter((c) => facturasPeriodo.has(c.compraId))
        : comprasTodas;

    return new ResumenFinanciero({
      totalIngresos: totalIngresos.pesos,
      totalGanancia: utilidadPesos,
      totalDiezmo: totalDiezmo.pesos,
      gananciaNeta: gananciaNetaPesos,
      unidadesVendidas,
      totalEntradas,
      totalSalidas,
      totalInversion: totalInversion.pesos,
      valorInventarioCosto: valorCosto.pesos,
      valorInventarioVenta: valorVenta.pesos,
      compras,
    });
  }

  /**
   * Cada factura (compraId) agrupa varias líneas ENTRADA.
   * Las ventas se atribuyen FIFO por helado a las líneas; luego se suman por factura.
   */
  private static resumenesPorCompra(
    movimientos: MovimientoInventario[]
  ): ResumenCompraProps[] {
    const calculadora = new CalculadoraDiezmo();
    const cronologico = [...movimientos].sort(
      (a, b) => a.fecha.getTime() - b.fecha.getTime()
    );

    const lotes: LoteLinea[] = [];
    const ordenFacturas: string[] = [];
    const vistoFactura = new Set<string>();
    const extrasPorCompra = new Map<string, ResumenExtraCompraProps[]>();

    for (const m of cronologico) {
      if (m.tipo === TipoMovimiento.ENTRADA) {
        const compraId = m.facturaId;
        if (!vistoFactura.has(compraId)) {
          vistoFactura.add(compraId);
          ordenFacturas.push(compraId);
        }
        lotes.push({
          compraId,
          heladoId: m.heladoId,
          heladoNombre: m.heladoNombre,
          fecha: m.fecha,
          unidadesCompradas: m.cantidad,
          restante: m.cantidad,
          inversion: m.gastoInversion.pesos,
          ingresos: 0,
          unidadesVendidas: 0,
          nota: m.nota,
        });
        continue;
      }

      if (m.tipo === TipoMovimiento.GASTO && m.compraId) {
        const lista = extrasPorCompra.get(m.compraId) ?? [];
        lista.push({
          concepto: m.heladoNombre,
          monto: m.gastoInversion.pesos,
        });
        extrasPorCompra.set(m.compraId, lista);
        continue;
      }

      if (
        m.tipo !== TipoMovimiento.SALIDA &&
        m.tipo !== TipoMovimiento.CONSUMO_PERSONAL
      ) {
        continue;
      }

      let pendiente = m.cantidad;
      const precioUnitario =
        m.tipo === TipoMovimiento.SALIDA ? m.precioVentaUnitario.pesos : 0;

      for (const lote of lotes) {
        if (pendiente <= 0) break;
        if (lote.heladoId !== m.heladoId || lote.restante <= 0) continue;

        const tomar = Math.min(pendiente, lote.restante);
        lote.restante -= tomar;
        pendiente -= tomar;

        if (m.tipo === TipoMovimiento.SALIDA) {
          lote.ingresos += tomar * precioUnitario;
          lote.unidadesVendidas += tomar;
        }
      }
    }

    return ordenFacturas.map((compraId, index) => {
      const lineasLote = lotes.filter((l) => l.compraId === compraId);
      const lineas: ResumenLineaCompraProps[] = lineasLote.map((l) => ({
        heladoId: l.heladoId,
        heladoNombre: l.heladoNombre,
        unidadesCompradas: l.unidadesCompradas,
        unidadesVendidas: l.unidadesVendidas,
        unidadesRestantes: l.restante,
        inversion: l.inversion,
        ingresos: l.ingresos,
      }));
      const extras = extrasPorCompra.get(compraId) ?? [];
      const inversionExtras = extras.reduce((s, e) => s + e.monto, 0);

      const inversion =
        lineas.reduce((s, l) => s + l.inversion, 0) + inversionExtras;
      const ingresos = lineas.reduce((s, l) => s + l.ingresos, 0);
      const unidadesCompradas = lineas.reduce(
        (s, l) => s + l.unidadesCompradas,
        0
      );
      const unidadesVendidas = lineas.reduce(
        (s, l) => s + l.unidadesVendidas,
        0
      );
      const unidadesRestantes = lineas.reduce(
        (s, l) => s + l.unidadesRestantes,
        0
      );
      const utilidad = ingresos - inversion;
      const baseDiezmo = utilidad > 0 ? Dinero.dePesos(utilidad) : Dinero.cero();
      const diezmo = calculadora.calcular(baseDiezmo);
      const fecha = lineasLote[0]?.fecha ?? new Date();
      const nota = lineasLote.find((l) => l.nota)?.nota ?? "";
      const nombres = [
        ...lineas.map((l) => l.heladoNombre),
        ...extras.map((e) => e.concepto),
      ];
      const detalle = nombres.join(", ");

      return {
        compraId,
        numero: index + 1,
        fecha: fecha.toISOString(),
        detalle,
        lineas,
        extras,
        unidadesCompradas,
        unidadesVendidas,
        unidadesRestantes,
        inversion,
        ingresos,
        utilidad,
        diezmo: diezmo.pesos,
        nota,
      };
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
      compras: this.compras.map((c) => c.toJSON()),
    };
  }
}
