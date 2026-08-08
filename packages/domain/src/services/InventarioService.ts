import { Helado } from "../entities/Helado.js";
import {
  MovimientoInventario,
  TipoMovimiento,
} from "../entities/MovimientoInventario.js";
import type { IInventarioRepository } from "../repositories/IInventarioRepository.js";
import { ResumenFinanciero } from "./ResumenFinanciero.js";
import { Dinero } from "../value-objects/Dinero.js";

export interface CrearHeladoDTO {
  nombre: string;
  sabor: string;
  precioCosto: number;
  precioVenta: number;
  stockInicial?: number;
}

export interface ActualizarHeladoDTO {
  nombre?: string;
  sabor?: string;
  precioCosto?: number;
  precioVenta?: number;
}

export interface RegistrarMovimientoDTO {
  /** Requerido excepto en GASTO */
  heladoId?: string;
  tipo: TipoMovimiento;
  cantidad: number;
  nota?: string;
  /** Solo para ajustes: stock absoluto deseado */
  stockObjetivo?: number;
  /**
   * Precio de venta unitario (solo SALIDA).
   * Si no se envía, se usa el precio del catálogo del helado.
   */
  precioVentaUnitario?: number;
  /** Concepto del gasto (solo GASTO), ej. "Cartel de helados" */
  concepto?: string;
  /** Monto total del gasto (solo GASTO) */
  monto?: number;
  /** Id de factura (solo ENTRADA); si no se envía se genera uno. */
  compraId?: string;
}

export interface LineaCompraDTO {
  heladoId: string;
  cantidad: number;
}

/** Extra de la misma factura (afiche, cucharas, etc.). */
export interface ExtraCompraDTO {
  concepto: string;
  monto: number;
}

/** Una factura de compra con uno o varios helados (+ extras opcionales). */
export interface RegistrarCompraDTO {
  lineas: LineaCompraDTO[];
  extras?: ExtraCompraDTO[];
  nota?: string;
}

/** Una venta/ticket con uno o varios helados. */
export interface RegistrarVentaDTO {
  lineas: LineaVentaDTO[];
  nota?: string;
}

export interface LineaVentaDTO {
  heladoId: string;
  cantidad: number;
  /** Precio especial por unidad; si no se envía, usa el del catálogo. */
  precioVentaUnitario?: number;
}

export interface EditarMovimientoDTO {
  /** Nuevo precio cobrado por unidad (solo SALIDA) */
  precioVentaUnitario?: number;
  /** Nuevo monto del gasto (solo GASTO) */
  monto?: number;
  /** Nuevo concepto / nombre mostrado (solo GASTO) */
  concepto?: string;
  nota?: string;
}

/**
 * Servicio de aplicación / dominio: orquesta el inventario.
 * Único punto de entrada para la UI.
 */
export class InventarioService {
  constructor(private readonly repo: IInventarioRepository) {}

  async listarHelados(soloActivos = true): Promise<Helado[]> {
    const todos = await this.repo.listarHelados();
    return soloActivos ? todos.filter((h) => h.activo) : todos;
  }

  async obtenerHelado(id: string): Promise<Helado> {
    const helado = await this.repo.obtenerHelado(id);
    if (!helado) {
      throw new Error(`Helado no encontrado: ${id}`);
    }
    return helado;
  }

  async agregarHelado(dto: CrearHeladoDTO): Promise<Helado> {
    const stock = dto.stockInicial ?? 0;
    const helado = new Helado({
      id: crypto.randomUUID(),
      nombre: dto.nombre,
      sabor: dto.sabor,
      precioCosto: dto.precioCosto,
      precioVenta: dto.precioVenta,
      stock,
    });

    await this.repo.guardarHelado(helado);

    if (stock > 0) {
      const compraId = crypto.randomUUID();
      const movimiento = new MovimientoInventario({
        id: crypto.randomUUID(),
        heladoId: helado.id,
        heladoNombre: helado.nombre,
        tipo: TipoMovimiento.ENTRADA,
        cantidad: stock,
        stockAnterior: 0,
        stockNuevo: stock,
        precioCostoUnitario: helado.precioCosto.pesos,
        precioVentaUnitario: helado.precioVenta.pesos,
        gananciaTotal: 0,
        diezmo: 0,
        nota: "Stock inicial",
        compraId,
      });
      await this.repo.guardarMovimiento(movimiento);
    }

    return helado;
  }

  async editarHelado(id: string, dto: ActualizarHeladoDTO): Promise<Helado> {
    const helado = await this.obtenerHelado(id);
    helado.actualizar(dto);
    await this.repo.guardarHelado(helado);
    return helado;
  }

  async eliminarHelado(id: string): Promise<void> {
    const helado = await this.obtenerHelado(id);
    helado.desactivar();
    await this.repo.guardarHelado(helado);
  }

  /**
   * Registra una factura de compra con varias líneas (helados)
   * y extras opcionales (afiche, cucharas…) bajo el mismo compraId.
   */
  async registrarCompra(
    dto: RegistrarCompraDTO
  ): Promise<MovimientoInventario[]> {
    if (!dto.lineas.length) {
      throw new Error("La compra debe tener al menos un helado");
    }

    const vistos = new Set<string>();
    for (const linea of dto.lineas) {
      if (!linea.heladoId) {
        throw new Error("Cada línea necesita un helado");
      }
      if (!Number.isFinite(linea.cantidad) || linea.cantidad < 1) {
        throw new Error("La cantidad de cada línea debe ser al menos 1");
      }
      if (vistos.has(linea.heladoId)) {
        throw new Error(
          "No repitas el mismo helado en la factura; suma la cantidad en una sola línea"
        );
      }
      vistos.add(linea.heladoId);
    }

    const extras = dto.extras ?? [];
    for (const extra of extras) {
      const concepto = extra.concepto.trim();
      if (!concepto) {
        throw new Error("Cada extra necesita un concepto (ej. Afiche)");
      }
      if (!Number.isFinite(extra.monto) || extra.monto < 0) {
        throw new Error(`El monto de "${concepto}" no es válido`);
      }
    }

    const compraId = crypto.randomUUID();
    const fecha = new Date().toISOString();
    const creados: MovimientoInventario[] = [];

    for (const linea of dto.lineas) {
      const helado = await this.obtenerHelado(linea.heladoId);
      const stockAnterior = helado.stock;
      helado.aumentarStock(linea.cantidad);
      await this.repo.guardarHelado(helado);

      const movimiento = new MovimientoInventario({
        id: crypto.randomUUID(),
        heladoId: helado.id,
        heladoNombre: helado.nombre,
        tipo: TipoMovimiento.ENTRADA,
        cantidad: linea.cantidad,
        stockAnterior,
        stockNuevo: helado.stock,
        precioCostoUnitario: helado.precioCosto.pesos,
        precioVentaUnitario: helado.precioVenta.pesos,
        gananciaTotal: 0,
        diezmo: 0,
        nota: dto.nota,
        fecha,
        compraId,
      });
      await this.repo.guardarMovimiento(movimiento);
      creados.push(movimiento);
    }

    for (const extra of extras) {
      const concepto = extra.concepto.trim();
      if (extra.monto === 0) continue;
      const movimiento = new MovimientoInventario({
        id: crypto.randomUUID(),
        heladoId: "",
        heladoNombre: concepto,
        tipo: TipoMovimiento.GASTO,
        cantidad: 1,
        stockAnterior: 0,
        stockNuevo: 0,
        precioCostoUnitario: extra.monto,
        precioVentaUnitario: 0,
        gananciaTotal: 0,
        diezmo: 0,
        nota: dto.nota,
        fecha,
        compraId,
      });
      await this.repo.guardarMovimiento(movimiento);
      creados.push(movimiento);
    }

    return creados;
  }

  /**
   * Registra un ticket de venta con una o varias líneas (helados distintos).
   * Todas las salidas comparten el mismo id de ticket (compraId en persistencia).
   */
  async registrarVenta(
    dto: RegistrarVentaDTO
  ): Promise<MovimientoInventario[]> {
    if (!dto.lineas.length) {
      throw new Error("La venta debe tener al menos un helado");
    }

    const vistos = new Set<string>();
    for (const linea of dto.lineas) {
      if (!linea.heladoId) {
        throw new Error("Cada línea necesita un helado");
      }
      if (!Number.isFinite(linea.cantidad) || linea.cantidad < 1) {
        throw new Error("La cantidad de cada línea debe ser al menos 1");
      }
      if (vistos.has(linea.heladoId)) {
        throw new Error(
          "No repitas el mismo helado en el ticket; suma la cantidad en una sola línea"
        );
      }
      vistos.add(linea.heladoId);
      if (
        linea.precioVentaUnitario !== undefined &&
        (!Number.isFinite(linea.precioVentaUnitario) ||
          linea.precioVentaUnitario < 0)
      ) {
        throw new Error("El precio especial debe ser un número mayor o igual a 0");
      }
    }

    const ventaId = crypto.randomUUID();
    const fecha = new Date().toISOString();
    const creados: MovimientoInventario[] = [];

    for (const linea of dto.lineas) {
      const helado = await this.obtenerHelado(linea.heladoId);
      if (linea.cantidad > helado.stock) {
        throw new Error(
          `Stock insuficiente de ${helado.nombre}: hay ${helado.stock}, pediste ${linea.cantidad}`
        );
      }

      const stockAnterior = helado.stock;
      helado.disminuirStock(linea.cantidad);
      await this.repo.guardarHelado(helado);

      const precioVentaUnitario =
        linea.precioVentaUnitario !== undefined
          ? linea.precioVentaUnitario
          : helado.precioVenta.pesos;
      const gananciaUnitariaPesos = Math.max(
        0,
        precioVentaUnitario - helado.precioCosto.pesos
      );
      const gananciaTotal = Dinero.dePesos(gananciaUnitariaPesos).multiplicar(
        linea.cantidad
      );

      const movimiento = new MovimientoInventario({
        id: crypto.randomUUID(),
        heladoId: helado.id,
        heladoNombre: helado.nombre,
        tipo: TipoMovimiento.SALIDA,
        cantidad: linea.cantidad,
        stockAnterior,
        stockNuevo: helado.stock,
        precioCostoUnitario: helado.precioCosto.pesos,
        precioVentaUnitario,
        gananciaTotal: gananciaTotal.pesos,
        diezmo: 0,
        nota: dto.nota,
        fecha,
        compraId: ventaId,
      });
      await this.repo.guardarMovimiento(movimiento);
      creados.push(movimiento);
    }

    return creados;
  }

  async registrarMovimiento(
    dto: RegistrarMovimientoDTO
  ): Promise<MovimientoInventario> {
    if (dto.tipo === TipoMovimiento.GASTO) {
      return this.registrarGasto(dto);
    }

    if (!dto.heladoId) {
      throw new Error("Debes seleccionar un helado");
    }

    const helado = await this.obtenerHelado(dto.heladoId);
    const stockAnterior = helado.stock;
    let stockNuevo: number;
    let cantidad = dto.cantidad;
    let gananciaTotal = Dinero.cero();
    let diezmo = Dinero.cero();
    let precioVentaUnitario = helado.precioVenta.pesos;
    let compraId: string | undefined = dto.compraId;

    switch (dto.tipo) {
      case TipoMovimiento.ENTRADA: {
        helado.aumentarStock(dto.cantidad);
        stockNuevo = helado.stock;
        if (!compraId) {
          compraId = crypto.randomUUID();
        }
        break;
      }
      case TipoMovimiento.SALIDA: {
        helado.disminuirStock(dto.cantidad);
        stockNuevo = helado.stock;
        if (dto.precioVentaUnitario !== undefined) {
          if (!Number.isFinite(dto.precioVentaUnitario) || dto.precioVentaUnitario < 0) {
            throw new Error("El precio especial debe ser un número mayor o igual a 0");
          }
          precioVentaUnitario = dto.precioVentaUnitario;
        }
        // Margen unitario solo informativo; el diezmo se calcula en el resumen
        // como 10% de (ingresos − inversión).
        const gananciaUnitariaPesos = Math.max(
          0,
          precioVentaUnitario - helado.precioCosto.pesos
        );
        gananciaTotal = Dinero.dePesos(gananciaUnitariaPesos).multiplicar(
          dto.cantidad
        );
        diezmo = Dinero.cero();
        if (!compraId) {
          compraId = crypto.randomUUID();
        }
        break;
      }
      case TipoMovimiento.CONSUMO_PERSONAL: {
        helado.disminuirStock(dto.cantidad);
        stockNuevo = helado.stock;
        break;
      }
      case TipoMovimiento.AJUSTE: {
        if (dto.stockObjetivo === undefined) {
          throw new Error("El ajuste requiere stockObjetivo");
        }
        stockNuevo = dto.stockObjetivo;
        cantidad = Math.abs(stockNuevo - stockAnterior);
        helado.ajustarStock(stockNuevo);
        break;
      }
      default:
        throw new Error(`Tipo de movimiento no soportado: ${dto.tipo}`);
    }

    await this.repo.guardarHelado(helado);

    const saleACosto = dto.tipo === TipoMovimiento.CONSUMO_PERSONAL;
    const movimiento = new MovimientoInventario({
      id: crypto.randomUUID(),
      heladoId: helado.id,
      heladoNombre: helado.nombre,
      tipo: dto.tipo,
      cantidad,
      stockAnterior,
      stockNuevo,
      precioCostoUnitario: helado.precioCosto.pesos,
      precioVentaUnitario: saleACosto
        ? helado.precioCosto.pesos
        : precioVentaUnitario,
      gananciaTotal: gananciaTotal.pesos,
      diezmo: diezmo.pesos,
      nota: dto.nota,
      compraId,
    });

    await this.repo.guardarMovimiento(movimiento);
    return movimiento;
  }

  private async registrarGasto(
    dto: RegistrarMovimientoDTO
  ): Promise<MovimientoInventario> {
    const concepto = (dto.concepto ?? dto.nota ?? "").trim();
    if (!concepto) {
      throw new Error("El gasto necesita un concepto (ej. Cartel de helados)");
    }
    if (dto.monto === undefined || !Number.isFinite(dto.monto) || dto.monto < 0) {
      throw new Error("El gasto necesita un monto válido");
    }

    const movimiento = new MovimientoInventario({
      id: crypto.randomUUID(),
      heladoId: "",
      heladoNombre: concepto,
      tipo: TipoMovimiento.GASTO,
      cantidad: 1,
      stockAnterior: 0,
      stockNuevo: 0,
      precioCostoUnitario: dto.monto,
      precioVentaUnitario: 0,
      gananciaTotal: 0,
      diezmo: 0,
      nota: dto.nota,
    });

    await this.repo.guardarMovimiento(movimiento);
    return movimiento;
  }

  async editarMovimiento(
    id: string,
    dto: EditarMovimientoDTO
  ): Promise<MovimientoInventario> {
    const actual = (await this.repo.listarMovimientos()).find((m) => m.id === id);
    if (!actual) {
      throw new Error(`Movimiento no encontrado: ${id}`);
    }

    if (actual.tipo === TipoMovimiento.SALIDA) {
      return this.editarVenta(actual, dto);
    }
    if (actual.tipo === TipoMovimiento.GASTO) {
      return this.editarGasto(actual, dto);
    }

    throw new Error(
      "Solo se pueden editar ventas (precio) o gastos (monto/concepto)"
    );
  }

  private async editarVenta(
    actual: MovimientoInventario,
    dto: EditarMovimientoDTO
  ): Promise<MovimientoInventario> {
    const precioVenta =
      dto.precioVentaUnitario !== undefined
        ? dto.precioVentaUnitario
        : actual.precioVentaUnitario.pesos;

    if (!Number.isFinite(precioVenta) || precioVenta < 0) {
      throw new Error("El precio de venta debe ser un número mayor o igual a 0");
    }

    const gananciaUnitariaPesos = Math.max(
      0,
      precioVenta - actual.precioCostoUnitario.pesos
    );
    const gananciaTotal = Dinero.dePesos(gananciaUnitariaPesos).multiplicar(
      actual.cantidad
    );
    const json = actual.toJSON();

    const actualizado = new MovimientoInventario({
      ...json,
      precioVentaUnitario: precioVenta,
      gananciaTotal: gananciaTotal.pesos,
      diezmo: 0,
      nota: dto.nota !== undefined ? dto.nota : json.nota,
      fecha: json.fecha,
    });

    await this.repo.actualizarMovimiento(actualizado);
    return actualizado;
  }

  private async editarGasto(
    actual: MovimientoInventario,
    dto: EditarMovimientoDTO
  ): Promise<MovimientoInventario> {
    const monto =
      dto.monto !== undefined ? dto.monto : actual.precioCostoUnitario.pesos;
    if (!Number.isFinite(monto) || monto < 0) {
      throw new Error("El monto del gasto debe ser un número mayor o igual a 0");
    }

    const concepto =
      dto.concepto !== undefined
        ? dto.concepto.trim()
        : actual.heladoNombre;
    if (!concepto) {
      throw new Error("El gasto necesita un concepto");
    }

    const json = actual.toJSON();
    const actualizado = new MovimientoInventario({
      ...json,
      heladoNombre: concepto,
      precioCostoUnitario: monto,
      nota: dto.nota !== undefined ? dto.nota : json.nota,
      fecha: json.fecha,
    });

    await this.repo.actualizarMovimiento(actualizado);
    return actualizado;
  }

  async listarMovimientos(): Promise<MovimientoInventario[]> {
    const movimientos = await this.repo.listarMovimientos();
    return movimientos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  async listarDiezmosEntregados(): Promise<string[]> {
    return this.repo.listarDiezmosEntregados();
  }

  async marcarDiezmoEntregado(
    compraId: string,
    entregado: boolean
  ): Promise<void> {
    if (!compraId.trim()) {
      throw new Error("La compra no es válida");
    }
    await this.repo.guardarDiezmoEntregado(compraId, entregado);
  }

  async obtenerResumen(): Promise<ResumenFinanciero> {
    const helados = await this.listarHelados(true);
    let valorCosto = Dinero.cero();
    let valorVenta = Dinero.cero();

    for (const h of helados) {
      valorCosto = valorCosto.sumar(h.valorInventarioCosto());
      valorVenta = valorVenta.sumar(h.valorInventarioVenta());
    }

    return ResumenFinanciero.desdeMovimientos(
      await this.listarMovimientos(),
      valorCosto,
      valorVenta
    );
  }
}
