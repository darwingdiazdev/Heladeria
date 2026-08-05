import type { MovimientoInventario } from "@inventario/domain";
import { formatearFecha, formatearMoneda } from "../lib/inventario";

interface Props {
  movimientos: MovimientoInventario[];
}

export function MovimientoList({ movimientos }: Props) {
  if (movimientos.length === 0) {
    return (
      <div className="empty">
        <p>Sin movimientos todavía. Registra una entrada o una venta.</p>
      </div>
    );
  }

  return (
    <div className="list">
      {movimientos.map((m) => (
        <article key={m.id} className={`mov-item mov-item--${m.tipo}`}>
          <div className="mov-item__row">
            <span className="mov-item__title">{m.heladoNombre}</span>
            <span className="mov-item__tipo">{m.etiquetaTipo}</span>
          </div>
          <p className="mov-item__detail">
            Cantidad: {m.cantidad} · Stock {m.stockAnterior} → {m.stockNuevo}
            {m.nota ? ` · ${m.nota}` : ""}
          </p>
          <p className="mov-item__detail">{formatearFecha(m.fecha)}</p>
          {m.esEntrada && (
            <div className="mov-item__money">
              <span className="pill pill--inversion">
                Inversión {formatearMoneda(m.gastoInversion.pesos)}
              </span>
              <span className="pill pill--consumo">
                {formatearMoneda(m.precioCostoUnitario.pesos)} / u × {m.cantidad}
              </span>
            </div>
          )}
          {m.esVenta && (
            <div className="mov-item__money">
              <span className="pill pill--inversion">
                Ingreso {formatearMoneda(m.ingreso.pesos)}
              </span>
              <span className="pill">
                Ganancia {formatearMoneda(m.gananciaTotal.pesos)}
              </span>
              <span className="pill pill--diezmo">
                Diezmo {formatearMoneda(m.diezmo.pesos)}
              </span>
            </div>
          )}
          {m.esConsumoPersonal && (
            <div className="mov-item__money">
              <span className="pill pill--consumo">
                Ingreso a costo {formatearMoneda(m.ingreso.pesos)} · sin
                ganancia
              </span>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
