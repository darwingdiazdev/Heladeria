import { useMemo } from "react";
import type { MovimientoInventario } from "@inventario/domain";
import { formatearFecha, formatearMoneda } from "../lib/inventario";

interface Props {
  movimientos: MovimientoInventario[];
  vacioMensaje?: string;
  onEditar?: (movimiento: MovimientoInventario) => void;
}

interface TicketVista {
  key: string;
  fecha: Date;
  nota: string;
  lineas: MovimientoInventario[];
  total: number;
}

export function VentaList({
  movimientos,
  vacioMensaje = "Sin ventas en este periodo.",
  onEditar,
}: Props) {
  const tickets = useMemo(() => {
    const mapa = new Map<string, TicketVista>();

    for (const m of movimientos) {
      const key = m.facturaId;
      const actual = mapa.get(key);
      if (actual) {
        actual.lineas.push(m);
        actual.total += m.ingreso.pesos;
        if (!actual.nota && m.nota) actual.nota = m.nota;
        if (m.fecha.getTime() < actual.fecha.getTime()) actual.fecha = m.fecha;
      } else {
        mapa.set(key, {
          key,
          fecha: m.fecha,
          nota: m.nota,
          lineas: [m],
          total: m.ingreso.pesos,
        });
      }
    }

    return [...mapa.values()].sort(
      (a, b) => b.fecha.getTime() - a.fecha.getTime()
    );
  }, [movimientos]);

  if (tickets.length === 0) {
    return (
      <div className="empty">
        <p>{vacioMensaje}</p>
      </div>
    );
  }

  return (
    <div className="list">
      {tickets.map((t) => (
        <article key={t.key} className="mov-item mov-item--SALIDA">
          <div className="mov-item__row">
            <span className="mov-item__title">
              Ticket · {t.lineas.length} helado
              {t.lineas.length === 1 ? "" : "s"}
            </span>
            <span className="mov-item__tipo">Venta</span>
          </div>
          <p className="mov-item__detail">{formatearFecha(t.fecha)}</p>
          {t.nota && <p className="mov-item__detail">{t.nota}</p>}

          <ul className="factura-detalle">
            {t.lineas.map((l) => (
              <li key={l.id}>
                <span>
                  {l.heladoNombre} × {l.cantidad} ·{" "}
                  {formatearMoneda(l.precioVentaUnitario.pesos)} / u
                </span>
                <strong>{formatearMoneda(l.ingreso.pesos)}</strong>
              </li>
            ))}
          </ul>

          <div className="mov-item__money">
            <span className="pill pill--inversion">
              Total {formatearMoneda(t.total)}
            </span>
          </div>

          {onEditar && (
            <div className="mov-item__actions">
              {t.lineas.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => onEditar(l)}
                >
                  Editar {l.heladoNombre}
                </button>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
