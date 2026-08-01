import { Helado } from "../entities/Helado.js";
import {
  MovimientoInventario,
  TipoMovimiento,
} from "../entities/MovimientoInventario.js";
import type { IInventarioRepository } from "../repositories/IInventarioRepository.js";
import { CalculadoraDiezmo } from "./CalculadoraDiezmo.js";
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
  heladoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  nota?: string;
  /** Solo para ajustes: stock absoluto deseado */
  stockObjetivo?: number;
}

/**
 * Servicio de aplicación / dominio: orquesta el inventario.
 * Único punto de entrada para la UI.
 */
export class InventarioService {
  private readonly diezmo = new CalculadoraDiezmo();

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

  async registrarMovimiento(
    dto: RegistrarMovimientoDTO
  ): Promise<MovimientoInventario> {
    const helado = await this.obtenerHelado(dto.heladoId);
    const stockAnterior = helado.stock;
    let stockNuevo: number;
    let cantidad = dto.cantidad;
    let gananciaTotal = Dinero.cero();
    let diezmo = Dinero.cero();

    switch (dto.tipo) {
      case TipoMovimiento.ENTRADA: {
        helado.aumentarStock(dto.cantidad);
        stockNuevo = helado.stock;
        break;
      }
      case TipoMovimiento.SALIDA: {
        // Solo las ventas generan ganancia y diezmo (10% de la ganancia).
        helado.disminuirStock(dto.cantidad);
        stockNuevo = helado.stock;
        gananciaTotal = helado.gananciaUnitaria().multiplicar(dto.cantidad);
        diezmo = this.diezmo.calcular(gananciaTotal);
        break;
      }
      case TipoMovimiento.CONSUMO_PERSONAL: {
        // Sale del inventario al precio de costo: sin ganancia ni diezmo.
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
        : helado.precioVenta.pesos,
      gananciaTotal: gananciaTotal.pesos,
      diezmo: diezmo.pesos,
      nota: dto.nota,
    });

    await this.repo.guardarMovimiento(movimiento);
    return movimiento;
  }

  async listarMovimientos(): Promise<MovimientoInventario[]> {
    const movimientos = await this.repo.listarMovimientos();
    return movimientos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
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
