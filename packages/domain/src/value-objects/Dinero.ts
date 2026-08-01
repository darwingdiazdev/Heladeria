/**
 * Value Object: representa una cantidad monetaria.
 * Inmutable y con operaciones aritméticas seguras.
 */
export class Dinero {
  private readonly centavos: number;

  private constructor(centavos: number) {
    this.centavos = Math.round(centavos);
  }

  static dePesos(pesos: number): Dinero {
    if (!Number.isFinite(pesos) || pesos < 0) {
      throw new Error("El monto debe ser un número finito mayor o igual a 0");
    }
    return new Dinero(pesos * 100);
  }

  static cero(): Dinero {
    return new Dinero(0);
  }

  get pesos(): number {
    return this.centavos / 100;
  }

  sumar(otro: Dinero): Dinero {
    return new Dinero(this.centavos + otro.centavos);
  }

  restar(otro: Dinero): Dinero {
    return new Dinero(this.centavos - otro.centavos);
  }

  multiplicar(factor: number): Dinero {
    return new Dinero(this.centavos * factor);
  }

  porcentaje(porcentaje: number): Dinero {
    return new Dinero((this.centavos * porcentaje) / 100);
  }

  esMayorQue(otro: Dinero): boolean {
    return this.centavos > otro.centavos;
  }

  esIgualA(otro: Dinero): boolean {
    return this.centavos === otro.centavos;
  }

  formatear(locale = "es-CO", currency = "COP"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(this.pesos);
  }

  toJSON(): number {
    return this.pesos;
  }
}
