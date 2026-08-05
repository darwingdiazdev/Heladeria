import type { FormEvent } from "react";
import { TipoMovimiento, type Helado } from "@inventario/domain";

interface Props {
  helados: Helado[];
  heladoPreseleccionado?: Helado | null;
  onSubmit: (data: {
    heladoId: string;
    tipo: TipoMovimiento;
    cantidad: number;
    stockObjetivo?: number;
    nota?: string;
  }) => void;
  onCancel: () => void;
}

export function MovimientoForm({
  helados,
  heladoPreseleccionado,
  onSubmit,
  onCancel,
}: Props) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const tipo = String(fd.get("tipo")) as TipoMovimiento;
    const heladoId = String(fd.get("heladoId"));
    const cantidad = Number(fd.get("cantidad"));
    const stockObjetivo = fd.get("stockObjetivo")
      ? Number(fd.get("stockObjetivo"))
      : undefined;
    const nota = String(fd.get("nota") ?? "") || undefined;

    onSubmit({
      heladoId,
      tipo,
      cantidad: tipo === TipoMovimiento.AJUSTE ? 0 : cantidad,
      stockObjetivo:
        tipo === TipoMovimiento.AJUSTE ? stockObjetivo : undefined,
      nota,
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <p className="hint">
        En <strong>entrada</strong> se registra la inversión (cantidad × costo).
        En <strong>salida/venta</strong> el ingreso es a precio de venta (con
        ganancia y diezmo). En <strong>consumo personal</strong> el ingreso es
        a precio de costo (sin ganancia ni diezmo).
      </p>

      <div className="field">
        <label htmlFor="heladoId">Helado</label>
        <select
          id="heladoId"
          name="heladoId"
          required
          defaultValue={heladoPreseleccionado?.id ?? ""}
        >
          <option value="" disabled>
            Selecciona un helado
          </option>
          {helados.map((h) => (
            <option key={h.id} value={h.id}>
              {h.nombre} (stock: {h.stock}) · ganancia/u{" "}
              {h.gananciaUnitaria().pesos.toLocaleString("es-CO", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="tipo">Tipo de movimiento</label>
        <select id="tipo" name="tipo" required defaultValue={TipoMovimiento.SALIDA}>
          <option value={TipoMovimiento.ENTRADA}>Entrada (compra / producción)</option>
          <option value={TipoMovimiento.SALIDA}>Salida / Venta</option>
          <option value={TipoMovimiento.CONSUMO_PERSONAL}>
            Consumo personal (a precio de costo)
          </option>
          <option value={TipoMovimiento.AJUSTE}>Ajuste de stock</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="cantidad">Cantidad (entrada / salida)</label>
        <input
          id="cantidad"
          name="cantidad"
          type="number"
          min={1}
          step={1}
          defaultValue={1}
        />
      </div>

      <div className="field">
        <label htmlFor="stockObjetivo">Stock objetivo (solo ajuste)</label>
        <input
          id="stockObjetivo"
          name="stockObjetivo"
          type="number"
          min={0}
          step={1}
          placeholder="Ej. 25"
        />
      </div>

      <div className="field">
        <label htmlFor="nota">Nota (opcional)</label>
        <textarea id="nota" name="nota" placeholder="Detalle del movimiento…" />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn--primary">
          Registrar movimiento
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
