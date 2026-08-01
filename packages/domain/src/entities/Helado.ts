import { Dinero } from "../value-objects/Dinero.js";

export interface HeladoProps {
  id: string;
  nombre: string;
  sabor: string;
  precioCosto: number;
  precioVenta: number;
  stock: number;
  activo?: boolean;
  creadoEn?: string;
  actualizadoEn?: string;
}

/**
 * Entidad: Helado del inventario.
 * Encapsula precios, stock y cálculo de ganancia unitaria.
 */
export class Helado {
  readonly id: string;
  private _nombre: string;
  private _sabor: string;
  private _precioCosto: Dinero;
  private _precioVenta: Dinero;
  private _stock: number;
  private _activo: boolean;
  readonly creadoEn: Date;
  private _actualizadoEn: Date;

  constructor(props: HeladoProps) {
    if (!props.nombre?.trim()) {
      throw new Error("El nombre del helado es obligatorio");
    }
    if (props.stock < 0) {
      throw new Error("El stock no puede ser negativo");
    }

    this.id = props.id;
    this._nombre = props.nombre.trim();
    this._sabor = (props.sabor ?? "").trim();
    this._precioCosto = Dinero.dePesos(props.precioCosto);
    this._precioVenta = Dinero.dePesos(props.precioVenta);
    this._stock = props.stock;
    this._activo = props.activo ?? true;
    this.creadoEn = props.creadoEn ? new Date(props.creadoEn) : new Date();
    this._actualizadoEn = props.actualizadoEn
      ? new Date(props.actualizadoEn)
      : new Date();

    this.validarPrecios();
  }

  get nombre(): string {
    return this._nombre;
  }

  get sabor(): string {
    return this._sabor;
  }

  get precioCosto(): Dinero {
    return this._precioCosto;
  }

  get precioVenta(): Dinero {
    return this._precioVenta;
  }

  get stock(): number {
    return this._stock;
  }

  get activo(): boolean {
    return this._activo;
  }

  get actualizadoEn(): Date {
    return this._actualizadoEn;
  }

  /** Ganancia por unidad = precio venta − precio costo */
  gananciaUnitaria(): Dinero {
    return this._precioVenta.restar(this._precioCosto);
  }

  /** Valor total del stock a precio de costo */
  valorInventarioCosto(): Dinero {
    return this._precioCosto.multiplicar(this._stock);
  }

  /** Valor total del stock a precio de venta */
  valorInventarioVenta(): Dinero {
    return this._precioVenta.multiplicar(this._stock);
  }

  actualizar(datos: {
    nombre?: string;
    sabor?: string;
    precioCosto?: number;
    precioVenta?: number;
  }): void {
    if (datos.nombre !== undefined) {
      if (!datos.nombre.trim()) {
        throw new Error("El nombre del helado es obligatorio");
      }
      this._nombre = datos.nombre.trim();
    }
    if (datos.sabor !== undefined) {
      this._sabor = datos.sabor.trim();
    }
    if (datos.precioCosto !== undefined) {
      this._precioCosto = Dinero.dePesos(datos.precioCosto);
    }
    if (datos.precioVenta !== undefined) {
      this._precioVenta = Dinero.dePesos(datos.precioVenta);
    }
    this.validarPrecios();
    this.tocar();
  }

  aumentarStock(cantidad: number): void {
    if (cantidad <= 0) {
      throw new Error("La cantidad a aumentar debe ser mayor a 0");
    }
    this._stock += cantidad;
    this.tocar();
  }

  disminuirStock(cantidad: number): void {
    if (cantidad <= 0) {
      throw new Error("La cantidad a disminuir debe ser mayor a 0");
    }
    if (cantidad > this._stock) {
      throw new Error(
        `Stock insuficiente. Disponible: ${this._stock}, solicitado: ${cantidad}`
      );
    }
    this._stock -= cantidad;
    this.tocar();
  }

  ajustarStock(nuevoStock: number): void {
    if (nuevoStock < 0) {
      throw new Error("El stock no puede ser negativo");
    }
    this._stock = nuevoStock;
    this.tocar();
  }

  desactivar(): void {
    this._activo = false;
    this.tocar();
  }

  activar(): void {
    this._activo = true;
    this.tocar();
  }

  private validarPrecios(): void {
    if (this._precioVenta.esMayorQue(this._precioCosto) === false &&
        !this._precioVenta.esIgualA(this._precioCosto)) {
      // permitir venta = costo (ganancia 0), pero no venta < costo sin aviso
    }
    if (this._precioCosto.pesos > this._precioVenta.pesos) {
      throw new Error(
        "El precio de venta no puede ser menor que el precio de costo"
      );
    }
  }

  private tocar(): void {
    this._actualizadoEn = new Date();
  }

  toJSON(): HeladoProps {
    return {
      id: this.id,
      nombre: this._nombre,
      sabor: this._sabor,
      precioCosto: this._precioCosto.pesos,
      precioVenta: this._precioVenta.pesos,
      stock: this._stock,
      activo: this._activo,
      creadoEn: this.creadoEn.toISOString(),
      actualizadoEn: this._actualizadoEn.toISOString(),
    };
  }

  static desdeJSON(props: HeladoProps): Helado {
    return new Helado(props);
  }
}
