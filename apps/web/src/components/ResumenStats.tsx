import type { ResumenFinanciero } from "@inventario/domain";
import { formatearMoneda } from "../lib/inventario";

interface Props {
  resumen: ResumenFinanciero;
  periodo?: string;
}

export function ResumenStats({ resumen, periodo }: Props) {
  return (
    <section className="stats" aria-label="Resumen financiero del periodo">
      {periodo && (
        <p className="stats__periodo">Periodo: {periodo}</p>
      )}
      <div className="stat">
        <span className="stat__label">Inversión</span>
        <span className="stat__value">
          {formatearMoneda(resumen.totalInversion.pesos)}
        </span>
      </div>
      <div className="stat stat--accent">
        <span className="stat__label">Ingresos</span>
        <span className="stat__value">
          {formatearMoneda(resumen.totalIngresos.pesos)}
        </span>
      </div>
      <div className="stat stat--gold">
        <span className="stat__label">Ganancia</span>
        <span className="stat__value">
          {formatearMoneda(resumen.totalGanancia.pesos)}
        </span>
      </div>
      <div className="stat stat--coral">
        <span className="stat__label">Diezmo</span>
        <span className="stat__value">
          {formatearMoneda(resumen.totalDiezmo.pesos)}
        </span>
      </div>
    </section>
  );
}
