const CLAVE = "inventario-helados-tasa-bcv";

export interface TasaBcvGuardada {
  /** Bolívares por 1 USD */
  tasa: number;
  actualizadoEn: string;
}

export function leerTasaBcv(): TasaBcvGuardada | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TasaBcvGuardada;
    if (!Number.isFinite(parsed.tasa) || parsed.tasa <= 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function guardarTasaBcv(tasa: number): TasaBcvGuardada {
  if (!Number.isFinite(tasa) || tasa <= 0) {
    throw new Error("La tasa BCV debe ser un número mayor que 0");
  }
  const data: TasaBcvGuardada = {
    tasa,
    actualizadoEn: new Date().toISOString(),
  };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(CLAVE, JSON.stringify(data));
  }
  return data;
}

export function usdABs(usd: number, tasa: number): number {
  if (!Number.isFinite(usd) || !Number.isFinite(tasa)) return 0;
  return Math.round(usd * tasa * 100) / 100;
}

export function formatearBs(valor: number): string {
  return `Bs.S ${valor.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatearTasa(tasa: number): string {
  return formatearBs(tasa) + " / USD";
}
