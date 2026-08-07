import { type FormEvent, useMemo, useState } from "react";
import { TipoMovimiento, type Helado } from "@inventario/domain";

interface Props {
  helados: Helado[];
  heladoPreseleccionado?: Helado | null;
  onSubmit: (data: {
    heladoId?: string;
    tipo: TipoMovimiento;
    cantidad: number;
    stockObjetivo?: number;
    nota?: string;
    precioVentaUnitario?: number;
    concepto?: string;
    monto?: number;
  }) => void;
  onCancel: () => void;
}

export function MovimientoForm({
  helados,
  heladoPreseleccionado,
  onSubmit,
  onCancel,
}: Props) {
  const [tipo, setTipo] = useState<TipoMovimiento>(TipoMovimiento.SALIDA);
  const [heladoId, setHeladoId] = useState(
    heladoPreseleccionado?.id ?? ""
  );

  const heladoSeleccionado = useMemo(
    () => helados.find((h) => h.id === heladoId) ?? null,
    [helados, heladoId]
  );

  const esGasto = tipo === TipoMovimiento.GASTO;
  const esSalida = tipo === TipoMovimiento.SALIDA;
  const esAjuste = tipo === TipoMovimiento.AJUSTE;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nota = String(fd.get("nota") ?? "") || undefined;

    if (tipo === TipoMovimiento.GASTO) {
      const concepto = String(fd.get("concepto") ?? "").trim();
      const monto = Number(fd.get("monto"));
      onSubmit({
        tipo,
        cantidad: 1,
        concepto,
        monto,
        nota,
      });
      return;
    }

    const cantidad = Number(fd.get("cantidad"));
    const stockObjetivo = fd.get("stockObjetivo")
      ? Number(fd.get("stockObjetivo"))
      : undefined;

    let precioVentaUnitario: number | undefined;
    if (tipo === TipoMovimiento.SALIDA) {
      const raw = String(fd.get("precioVentaUnitario") ?? "").trim();
      if (raw !== "") {
        precioVentaUnitario = Number(raw);
      }
    }

    onSubmit({
      heladoId,
      tipo,
      cantidad: tipo === TipoMovimiento.AJUSTE ? 0 : cantidad,
      stockObjetivo:
        tipo === TipoMovimiento.AJUSTE ? stockObjetivo : undefined,
      precioVentaUnitario,
      nota,
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <p className="hint">
        En <strong>entrada</strong> se registra la inversión (cantidad × costo).
        En <strong>salida/venta</strong> puedes poner un precio especial; si lo
        dejas vacío usa el del catálogo. En <strong>consumo personal</strong> el
        ingreso es a costo. En <strong>gasto</strong> sumas inversión extra
        (cartel, cucharas, etc.) sin tocar el stock.
      </p>

      <div className="field">
        <label htmlFor="tipo">Tipo de movimiento</label>
        <select
          id="tipo"
          name="tipo"
          required
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoMovimiento)}
        >
          <option value={TipoMovimiento.ENTRADA}>
            Entrada (compra / producción)
          </option>
          <option value={TipoMovimiento.SALIDA}>Salida / Venta</option>
          <option value={TipoMovimiento.CONSUMO_PERSONAL}>
            Consumo personal (a precio de costo)
          </option>
          <option value={TipoMovimiento.GASTO}>
            Gasto / inversión (cartel, cucharas…)
          </option>
          <option value={TipoMovimiento.AJUSTE}>Ajuste de stock</option>
        </select>
      </div>

      {esGasto ? (
        <>
          <div className="field">
            <label htmlFor="concepto">Concepto</label>
            <input
              id="concepto"
              name="concepto"
              type="text"
              required
              placeholder="Ej. Cartel de helados"
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
              placeholder="Ej. 2.00"
            />
          </div>
        </>
      ) : (
        <>
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
              {helados.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nombre} (stock: {h.stock}) · venta{" "}
                  {h.precioVenta.pesos.toLocaleString("es-CO", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </option>
              ))}
            </select>
          </div>

          {!esAjuste && (
            <div className="field">
              <label htmlFor="cantidad">Cantidad (entrada / salida)</label>
              <input
                id="cantidad"
                name="cantidad"
                type="number"
                min={1}
                step={1}
                defaultValue={1}
                required
              />
            </div>
          )}

          {esSalida && (
            <div className="field">
              <label htmlFor="precioVentaUnitario">
                Precio especial por unidad (opcional)
              </label>
              <input
                id="precioVentaUnitario"
                name="precioVentaUnitario"
                type="number"
                min={0}
                step={0.01}
                placeholder={
                  heladoSeleccionado
                    ? `Catálogo: ${heladoSeleccionado.precioVenta.pesos}`
                    : "Usa el precio del catálogo"
                }
              />
              <p className="hint" style={{ marginTop: "0.35rem" }}>
                Vacío = precio del catálogo
                {heladoSeleccionado
                  ? ` ($${heladoSeleccionado.precioVenta.pesos})`
                  : ""}
                . Ej. vendiste a $1 en vez de $1.20 → escribe 1.
              </p>
            </div>
          )}

          {esAjuste && (
            <div className="field">
              <label htmlFor="stockObjetivo">Stock objetivo (solo ajuste)</label>
              <input
                id="stockObjetivo"
                name="stockObjetivo"
                type="number"
                min={0}
                step={1}
                placeholder="Ej. 25"
                required
              />
            </div>
          )}
        </>
      )}

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
