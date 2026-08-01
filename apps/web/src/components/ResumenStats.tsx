import type { ResumenFinanciero } from "@inventario/domain";
import { formatearMoneda } from "../lib/inventario";

interface Props {
  resumen: ResumenFinanciero;
}

export function ResumenStats({ resumen }: Props) {
  return (
    <section className="stats" aria-label="Resumen financiero">
      <div className="stat">
        <span className="stat__label">Inversión (entradas)</span>
        <span className="stat__value">
          {formatearMoneda(resumen.totalInversion.pesos)}
        </span>
      </div>
      <div className="stat stat--accent">
        <span className="stat__label">Ganancia</span>
        <span className="stat__value">
          {formatearMoneda(resumen.totalGanancia.pesos)}
        </span>
      </div>
      <div className="stat stat--coral">
        <span className="stat__label">Diezmo (solo ventas)</span>
        <span className="stat__value">
          {formatearMoneda(resumen.totalDiezmo.pesos)}
        </span>
      </div>
      <div className="stat stat--gold">
        <span className="stat__label">Ganancia neta</span>
        <span className="stat__value">
          {formatearMoneda(resumen.gananciaNeta.pesos)}
        </span>
      </div>
    </section>
  );
}
