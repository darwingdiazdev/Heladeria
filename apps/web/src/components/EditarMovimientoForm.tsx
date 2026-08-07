import type { FormEvent } from "react";
import { TipoMovimiento, type MovimientoInventario } from "@inventario/domain";
import { formatearMoneda } from "../lib/inventario";

interface Props {
  movimiento: MovimientoInventario;
  onSubmit: (data: {
    precioVentaUnitario?: number;
    monto?: number;
    concepto?: string;
    nota?: string;
  }) => void;
  onCancel: () => void;
}

export function EditarMovimientoForm({
  movimiento,
  onSubmit,
  onCancel,
}: Props) {
  const esVenta = movimiento.tipo === TipoMovimiento.SALIDA;
  const esGasto = movimiento.tipo === TipoMovimiento.GASTO;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nota = String(fd.get("nota") ?? "");

    if (esVenta) {
      onSubmit({
        precioVentaUnitario: Number(fd.get("precioVentaUnitario")),
        nota,
      });
      return;
    }

    if (esGasto) {
      onSubmit({
        concepto: String(fd.get("concepto") ?? "").trim(),
        monto: Number(fd.get("monto")),
        nota,
      });
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <p className="hint">
        {esVenta
          ? `Corrige el precio cobrado. Cantidad: ${movimiento.cantidad}. El stock no cambia; se recalculan ingreso, ganancia y diezmo.`
          : "Corrige el concepto o el monto del gasto. Suma a la inversión del periodo."}
      </p>

      <div className="field">
        <label>Registro</label>
        <p className="hint" style={{ margin: 0 }}>
          {movimiento.heladoNombre} · {movimiento.etiquetaTipo}
          {esVenta
            ? ` · costo/u ${formatearMoneda(movimiento.precioCostoUnitario.pesos)}`
            : ""}
        </p>
      </div>

      {esVenta && (
        <div className="field">
          <label htmlFor="precioVentaUnitario">Precio cobrado por unidad ($)</label>
          <input
            id="precioVentaUnitario"
            name="precioVentaUnitario"
            type="number"
            min={0}
            step={0.01}
            required
            defaultValue={movimiento.precioVentaUnitario.pesos}
          />
        </div>
      )}

      {esGasto && (
        <>
          <div className="field">
            <label htmlFor="concepto">Concepto</label>
            <input
              id="concepto"
              name="concepto"
              type="text"
              required
              defaultValue={movimiento.heladoNombre}
            />
          </div>
          <div className="field">
            <label htmlFor="monto">Monto ($)</label>
            <input
              id="monto"
              name="monto"
              type="number"
              min={0}
              step={0.01}
              required
              defaultValue={movimiento.precioCostoUnitario.pesos}
            />
          </div>
        </>
      )}

      <div className="field">
        <label htmlFor="nota">Nota (opcional)</label>
        <textarea
          id="nota"
          name="nota"
          defaultValue={movimiento.nota}
          placeholder="Detalle…"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn--primary">
          Guardar cambios
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
