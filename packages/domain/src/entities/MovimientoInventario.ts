import { Dinero } from "../value-objects/Dinero.js";

export enum TipoMovimiento {
  ENTRADA = "ENTRADA",
  SALIDA = "SALIDA",
  CONSUMO_PERSONAL = "CONSUMO_PERSONAL",
  AJUSTE = "AJUSTE",
  /** Compra de insumos / materiales que no son helado (cartel, cucharas, etc.). */
  GASTO = "GASTO",
}

export interface MovimientoProps {
  id: string;
  heladoId: string;
  heladoNombre: string;
  tipo: TipoMovimiento;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  precioCostoUnitario: number;
  precioVentaUnitario: number;
  gananciaTotal: number;
  diezmo: number;
  nota?: string;
  fecha?: string;
  /**
   * Id de agrupación:
   * - ENTRADA/GASTO → factura de compra
   * - SALIDA → ticket de venta (varios helados en la misma cobranza)
   * Si falta (datos viejos), se usa el id del movimiento.
   */
  compraId?: string;
}

/**
 * Entidad: Movimiento de inventario.
 * En salidas calcula el margen (venta − costo) como referencia.
 * El diezmo se calcula en el resumen: 10% de (ingresos − inversión).
 */
export class MovimientoInventario {
  readonly id: string;
  readonly heladoId: string;
  readonly heladoNombre: string;
  readonly tipo: TipoMovimiento;
  readonly cantidad: number;
  readonly stockAnterior: number;
  readonly stockNuevo: number;
  readonly precioCostoUnitario: Dinero;
  readonly precioVentaUnitario: Dinero;
  readonly gananciaTotal: Dinero;
  readonly diezmo: Dinero;
  readonly nota: string;
  readonly fecha: Date;
  readonly compraId: string | undefined;

  constructor(props: MovimientoProps) {
    if (props.cantidad < 0) {
      throw new Error("La cantidad del movimiento no puede ser negativa");
    }

    this.id = props.id;
    this.heladoId = props.heladoId;
    this.heladoNombre = props.heladoNombre;
    this.tipo = props.tipo;
    this.cantidad = props.cantidad;
    this.stockAnterior = props.stockAnterior;
    this.stockNuevo = props.stockNuevo;
    this.precioCostoUnitario = Dinero.dePesos(props.precioCostoUnitario);
    this.precioVentaUnitario = Dinero.dePesos(props.precioVentaUnitario);
    this.gananciaTotal = Dinero.dePesos(props.gananciaTotal);
    this.diezmo = Dinero.dePesos(props.diezmo);
    this.nota = props.nota?.trim() ?? "";
    this.fecha = props.fecha ? new Date(props.fecha) : new Date();
    this.compraId = props.compraId?.trim() || undefined;
  }

  /** Id de factura efectivo (compraId o el propio id en datos legacy). */
  get facturaId(): string {
    return this.compraId ?? this.id;
  }

  get esVenta(): boolean {
    return this.tipo === TipoMovimiento.SALIDA;
  }

  get esEntrada(): boolean {
    return this.tipo === TipoMovimiento.ENTRADA;
  }

  get esConsumoPersonal(): boolean {
    return this.tipo === TipoMovimiento.CONSUMO_PERSONAL;
  }

  get esGasto(): boolean {
    return this.tipo === TipoMovimiento.GASTO;
  }

  /** Gasto de inversión = cantidad × precio de costo (entradas y gastos). */
  get gastoInversion(): Dinero {
    return this.precioCostoUnitario.multiplicar(this.cantidad);
  }

  /**
   * Dinero cobrado:
   * - Venta → precio de venta × cantidad
   * - Consumo personal → precio de costo × cantidad (se paga al costo, sin ganancia)
   */
  get ingreso(): Dinero {
    if (this.esVenta) {
      return this.precioVentaUnitario.multiplicar(this.cantidad);
    }
    if (this.esConsumoPersonal) {
      return this.precioCostoUnitario.multiplicar(this.cantidad);
    }
    return Dinero.cero();
  }

  get etiquetaTipo(): string {
    switch (this.tipo) {
      case TipoMovimiento.ENTRADA:
        return "Entrada";
      case TipoMovimiento.SALIDA:
        return "Salida / Venta";
      case TipoMovimiento.CONSUMO_PERSONAL:
        return "Consumo personal";
      case TipoMovimiento.AJUSTE:
        return "Ajuste";
      case TipoMovimiento.GASTO:
        return "Gasto / inversión";
      default:
        return this.tipo;
    }
  }

  toJSON(): MovimientoProps {
    return {
      id: this.id,
      heladoId: this.heladoId,
      heladoNombre: this.heladoNombre,
      tipo: this.tipo,
      cantidad: this.cantidad,
      stockAnterior: this.stockAnterior,
      stockNuevo: this.stockNuevo,
      precioCostoUnitario: this.precioCostoUnitario.pesos,
      precioVentaUnitario: this.precioVentaUnitario.pesos,
      gananciaTotal: this.gananciaTotal.pesos,
      diezmo: this.diezmo.pesos,
      nota: this.nota,
      fecha: this.fecha.toISOString(),
      compraId: this.compraId,
    };
  }

  static desdeJSON(props: MovimientoProps): MovimientoInventario {
    return new MovimientoInventario(props);
  }
}
