/** Fecha local YYYY-MM-DD (para inputs type="date"). */
export function aFechaInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function inicioDelDia(fechaYYYYMMDD: string): Date {
  const [y, m, d] = fechaYYYYMMDD.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function finDelDia(fechaYYYYMMDD: string): Date {
  const [y, m, d] = fechaYYYYMMDD.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

export function rangoMesActual(): { desde: string; hasta: string } {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return { desde: aFechaInput(inicio), hasta: aFechaInput(hoy) };
}

export function rangoHoy(): { desde: string; hasta: string } {
  const hoy = aFechaInput(new Date());
  return { desde: hoy, hasta: hoy };
}

export function rangoSemanaActual(): { desde: string; hasta: string } {
  const hoy = new Date();
  const dia = hoy.getDay(); // 0 domingo
  const lunesOffset = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + lunesOffset);
  return { desde: aFechaInput(lunes), hasta: aFechaInput(hoy) };
}

export function estaEnRango(
  fecha: Date,
  desde: string,
  hasta: string
): boolean {
  const t = fecha.getTime();
  return t >= inicioDelDia(desde).getTime() && t <= finDelDia(hasta).getTime();
}
