import { useMemo } from "react";
import {
  TipoMovimiento,
  type MovimientoInventario,
} from "@inventario/domain";
import { formatearFecha, formatearMoneda } from "../lib/inventario";

interface Props {
  movimientos: MovimientoInventario[];
  vacioMensaje?: string;
  onEditarGasto?: (movimiento: MovimientoInventario) => void;
}

interface FacturaVista {
  key: string;
  fecha: Date;
  nota: string;
  helados: MovimientoInventario[];
  extras: MovimientoInventario[];
  inversion: number;
  esGastoSuelto: boolean;
}

export function CompraList({
  movimientos,
  vacioMensaje = "Sin compras en este periodo.",
  onEditarGasto,
}: Props) {
  const facturas = useMemo(() => {
    const mapa = new Map<string, FacturaVista>();

    for (const m of movimientos) {
      if (m.tipo !== TipoMovimiento.ENTRADA) continue;
      const key = m.facturaId;
      const actual = mapa.get(key);
      if (actual) {
        actual.helados.push(m);
        actual.inversion += m.gastoInversion.pesos;
        if (!actual.nota && m.nota) actual.nota = m.nota;
        if (m.fecha.getTime() < actual.fecha.getTime()) actual.fecha = m.fecha;
      } else {
        mapa.set(key, {
          key,
          fecha: m.fecha,
          nota: m.nota,
          helados: [m],
          extras: [],
          inversion: m.gastoInversion.pesos,
          esGastoSuelto: false,
        });
      }
    }

    const sueltos: FacturaVista[] = [];

    for (const m of movimientos) {
      if (m.tipo !== TipoMovimiento.GASTO) continue;

      if (m.compraId) {
        const factura = mapa.get(m.compraId);
        if (factura) {
          factura.extras.push(m);
          factura.inversion += m.gastoInversion.pesos;
        }
        continue;
      }

      sueltos.push({
        key: `gasto:${m.id}`,
        fecha: m.fecha,
        nota: m.nota,
        helados: [],
        extras: [m],
        inversion: m.gastoInversion.pesos,
        esGastoSuelto: true,
      });
    }

    return [...mapa.values(), ...sueltos].sort(
      (a, b) => b.fecha.getTime() - a.fecha.getTime()
    );
  }, [movimientos]);

  if (facturas.length === 0) {
    return (
      <div className="empty">
        <p>{vacioMensaje}</p>
      </div>
    );
  }

  return (
    <div className="list">
      {facturas.map((f) => {
        const nHelados = f.helados.length;
        return (
          <article
            key={f.key}
            className={`mov-item ${f.esGastoSuelto ? "mov-item--GASTO" : "mov-item--ENTRADA"}`}
          >
            <div className="mov-item__row">
              <span className="mov-item__title">
                {f.esGastoSuelto
                  ? f.extras[0]?.heladoNombre
                  : `Factura · ${nHelados} helado${nHelados === 1 ? "" : "s"}${
                      f.extras.length
                        ? ` · ${f.extras.length} extra${f.extras.length === 1 ? "" : "s"}`
                        : ""
                    }`}
              </span>
              <span className="mov-item__tipo">
                {f.esGastoSuelto ? "Gasto" : "Compra"}
              </span>
            </div>
            <p className="mov-item__detail">{formatearFecha(f.fecha)}</p>
            {f.nota && <p className="mov-item__detail">{f.nota}</p>}

            <ul className="factura-detalle">
              {f.helados.map((l) => (
                <li key={l.id}>
                  <span>
                    {l.heladoNombre} × {l.cantidad}
                  </span>
                  <strong>{formatearMoneda(l.gastoInversion.pesos)}</strong>
                </li>
              ))}
              {f.extras.map((l) => (
                <li key={l.id}>
                  <span>{l.heladoNombre}</span>
                  <strong>{formatearMoneda(l.gastoInversion.pesos)}</strong>
                </li>
              ))}
            </ul>

            <div className="mov-item__money">
              <span className="pill pill--inversion">
                Inversión {formatearMoneda(f.inversion)}
              </span>
            </div>

            {f.esGastoSuelto && onEditarGasto && f.extras[0] && (
              <div className="mov-item__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => onEditarGasto(f.extras[0]!)}
                >
                  Editar
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
