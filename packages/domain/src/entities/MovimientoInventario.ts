import { Dinero } from "../value-objects/Dinero.js";

export enum TipoMovimiento {
  ENTRADA = "ENTRADA",
  SALIDA = "SALIDA",
  CONSUMO_PERSONAL = "CONSUMO_PERSONAL",
  AJUSTE = "AJUSTE",
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
}

/**
 * Entidad: Movimiento de inventario.
 * En salidas calcula ganancia y diezmo (10%).
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

  /** Gasto de inversión = cantidad × precio de costo (entradas). */
  get gastoInversion(): Dinero {
    return this.precioCostoUnitario.multiplicar(this.cantidad);
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
    };
  }

  static desdeJSON(props: MovimientoProps): MovimientoInventario {
    return new MovimientoInventario(props);
  }
}
