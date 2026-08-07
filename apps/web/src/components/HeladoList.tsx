import type { Helado } from "@inventario/domain";
import { formatearMoneda } from "../lib/inventario";

interface Props {
  helados: Helado[];
  onEditar: (helado: Helado) => void;
  onMovimiento: (helado: Helado) => void;
  onEliminar: (helado: Helado) => void;
}

export function HeladoList({ helados, onEditar, onMovimiento, onEliminar }: Props) {
  if (helados.length === 0) {
    return (
      <div className="empty">
        <p>Aún no hay helados. Agrega el primero para empezar.</p>
      </div>
    );
  }

  return (
    <div className="list">
      {helados.map((h) => {
        const ganancia = h.gananciaUnitaria().pesos;
        const stockBajo = h.stock <= 5;

        return (
          <article key={h.id} className="helado-item">
            <div className="helado-item__top">
              <div>
                <h3 className="helado-item__name">{h.nombre}</h3>
                {h.sabor && <p className="helado-item__sabor">{h.sabor}</p>}
              </div>
              <span className={`stock-badge${stockBajo ? " stock-badge--low" : ""}`}>
                Stock {h.stock}
              </span>
            </div>

            <div className="helado-item__meta">
              <div className="meta-block">
                <span>Costo</span>
                <strong>{formatearMoneda(h.precioCosto.pesos)}</strong>
              </div>
              <div className="meta-block">
                <span>Venta</span>
                <strong>{formatearMoneda(h.precioVenta.pesos)}</strong>
              </div>
              <div className="meta-block meta-block--ganancia">
                <span>Ganancia / unidad</span>
                <strong>{formatearMoneda(ganancia)}</strong>
              </div>
            </div>

            <div className="helado-item__actions">
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onMovimiento(h)}
              >
                Vender
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onEditar(h)}
              >
                Editar
              </button>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => {
                  if (confirm(`¿Desactivar "${h.nombre}"?`)) onEliminar(h);
                }}
              >
                Quitar
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
