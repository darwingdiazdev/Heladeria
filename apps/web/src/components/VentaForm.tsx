import { type FormEvent, useMemo, useState } from "react";
import { TipoMovimiento, type Helado } from "@inventario/domain";
import { formatearMoneda } from "../lib/inventario";

interface Props {
  helados: Helado[];
  heladoPreseleccionado?: Helado | null;
  onSubmit: (data: {
    heladoId: string;
    tipo: TipoMovimiento;
    cantidad: number;
    precioVentaUnitario?: number;
    nota?: string;
  }) => void;
  onCancel: () => void;
}

export function VentaForm({
  helados,
  heladoPreseleccionado,
  onSubmit,
  onCancel,
}: Props) {
  const [heladoId, setHeladoId] = useState(
    heladoPreseleccionado?.id ?? ""
  );
  const [cantidad, setCantidad] = useState(1);
  const [precioEspecial, setPrecioEspecial] = useState("");

  const helado = useMemo(
    () => helados.find((h) => h.id === heladoId) ?? null,
    [helados, heladoId]
  );

  const precioUnitario = useMemo(() => {
    if (!helado) return 0;
    const raw = precioEspecial.trim();
    if (raw === "") return helado.precioVenta.pesos;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : helado.precioVenta.pesos;
  }, [helado, precioEspecial]);

  const totalCobrar = precioUnitario * (Number.isFinite(cantidad) ? cantidad : 0);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!heladoId) return;

    const raw = precioEspecial.trim();
    onSubmit({
      heladoId,
      tipo: TipoMovimiento.SALIDA,
      cantidad,
      precioVentaUnitario: raw !== "" ? Number(raw) : undefined,
      nota: String(new FormData(e.currentTarget).get("nota") ?? "") || undefined,
    });
  }

  const conStock = helados.filter((h) => h.stock > 0);

  return (
    <form className="form form--caja" onSubmit={handleSubmit}>
      <p className="hint">
        Caja de ventas: elige el helado, la cantidad y cobra. El diezmo se
        calcula en el resumen sobre la utilidad (ingresos − inversión), no por
        cada venta.
      </p>

      <div className="field">
        <label htmlFor="heladoId">Helado</label>
        <select
          id="heladoId"
          name="heladoId"
          required
          value={heladoId}
          onChange={(e) => setHeladoId(e.target.value)}
        >
          <option value="" disabled>
            Selecciona un helado
          </option>
          {conStock.map((h) => (
            <option key={h.id} value={h.id}>
              {h.nombre} · {formatearMoneda(h.precioVenta.pesos)} · stock{" "}
              {h.stock}
            </option>
          ))}
        </select>
        {helados.length > 0 && conStock.length === 0 && (
          <p className="hint" style={{ marginTop: "0.35rem" }}>
            No hay stock. Registra una compra primero.
          </p>
        )}
      </div>

      <div className="caja-grid">
        <div className="field">
          <label htmlFor="cantidad">Cantidad</label>
          <input
            id="cantidad"
            name="cantidad"
            type="number"
            min={1}
            max={helado?.stock ?? undefined}
            step={1}
            required
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
          />
        </div>

        <div className="field">
          <label htmlFor="precioVentaUnitario">Precio / u (opcional)</label>
          <input
            id="precioVentaUnitario"
            name="precioVentaUnitario"
            type="number"
            min={0}
            step={0.01}
            value={precioEspecial}
            onChange={(e) => setPrecioEspecial(e.target.value)}
            placeholder={
              helado ? `Catálogo: ${helado.precioVenta.pesos}` : "Catálogo"
            }
          />
        </div>
      </div>

      <div className="caja-total" aria-live="polite">
        <span className="caja-total__label">Total a cobrar</span>
        <strong className="caja-total__value">
          {formatearMoneda(totalCobrar)}
        </strong>
      </div>

      <div className="field">
        <label htmlFor="nota">Nota (opcional)</label>
        <textarea id="nota" name="nota" placeholder="Detalle de la venta…" />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={!heladoId || conStock.length === 0}
        >
          Cobrar venta
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
