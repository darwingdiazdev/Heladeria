import type { ResumenCompra } from "@inventario/domain";
import { formatearFecha, formatearMoneda } from "../lib/inventario";

interface Props {
  compras: ResumenCompra[];
  diezmosEntregados: Set<string>;
  onToggleDiezmo: (compraId: string, entregado: boolean) => void;
  saving?: boolean;
}

export function ResumenComprasList({
  compras,
  diezmosEntregados,
  onToggleDiezmo,
  saving = false,
}: Props) {
  if (compras.length === 0) {
    return (
      <div className="empty">
        <p>No hay compras en este periodo.</p>
      </div>
    );
  }

  const ordenadas = [...compras].sort((a, b) => b.numero - a.numero);

  return (
    <div className="list">
      {ordenadas.map((c) => {
        const entregado = diezmosEntregados.has(c.compraId);
        const checkId = `diezmo-${c.compraId}`;

        return (
          <article
            key={c.compraId}
            className={`mov-item mov-item--ENTRADA${entregado ? " mov-item--diezmo-ok" : ""}`}
          >
            <div className="mov-item__row">
              <span className="mov-item__title">{c.etiqueta}</span>
              <span className="mov-item__tipo">
                {c.unidadesVendidas}/{c.unidadesCompradas} u. vendidas
              </span>
            </div>
            <p className="mov-item__detail">{formatearFecha(c.fecha)}</p>
            <p className="mov-item__detail">{c.detalle}</p>
            {c.nota && <p className="mov-item__detail">{c.nota}</p>}

          <ul className="factura-detalle">
            {c.lineas.map((l) => (
              <li key={`${c.compraId}-${l.heladoId}`}>
                <span>
                  {l.heladoNombre} · {l.unidadesVendidas}/{l.unidadesCompradas}{" "}
                  vendidas
                </span>
                <strong>{formatearMoneda(l.inversion)}</strong>
              </li>
            ))}
            {c.extras.map((e, i) => (
              <li key={`${c.compraId}-extra-${i}`}>
                <span>{e.concepto}</span>
                <strong>{formatearMoneda(e.monto)}</strong>
              </li>
            ))}
          </ul>

            <div className="resumen-grid" style={{ marginTop: "0.65rem" }}>
              <div className="meta-block">
                <span>Inversión</span>
                <strong>{formatearMoneda(c.inversion.pesos)}</strong>
              </div>
              <div className="meta-block meta-block--ganancia">
                <span>Ingresos (ventas)</span>
                <strong>{formatearMoneda(c.ingresos.pesos)}</strong>
              </div>
              <div className="meta-block">
                <span>Utilidad</span>
                <strong>{formatearMoneda(c.utilidad.pesos)}</strong>
              </div>
              <div className="meta-block">
                <span>Diezmo (10%)</span>
                <strong>{formatearMoneda(c.diezmo.pesos)}</strong>
              </div>
            </div>

            {c.unidadesRestantes > 0 && (
              <p className="mov-item__detail" style={{ marginTop: "0.5rem" }}>
                Quedan {c.unidadesRestantes} u. de esta factura
              </p>
            )}

            <label className="diezmo-check" htmlFor={checkId}>
              <input
                id={checkId}
                type="checkbox"
                checked={entregado}
                disabled={saving}
                onChange={(e) =>
                  onToggleDiezmo(c.compraId, e.target.checked)
                }
              />
              <span>
                {entregado
                  ? "Diezmo entregado"
                  : `Marcar diezmo entregado (${formatearMoneda(c.diezmo.pesos)})`}
              </span>
            </label>
          </article>
        );
      })}
    </div>
  );
}
