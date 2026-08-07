import { useMemo, useState, type FormEvent } from "react";
import type { Helado } from "@inventario/domain";
import { formatearMoneda } from "../lib/inventario";

interface LineaDraft {
  key: string;
  heladoId: string;
  cantidad: number;
}

interface ExtraDraft {
  key: string;
  concepto: string;
  monto: string;
}

interface Props {
  helados: Helado[];
  heladoPreseleccionado?: Helado | null;
  onSubmitCompra: (data: {
    lineas: { heladoId: string; cantidad: number }[];
    extras?: { concepto: string; monto: number }[];
    nota?: string;
  }) => void;
  onCancel: () => void;
}

function nuevaLinea(heladoId = ""): LineaDraft {
  return {
    key: crypto.randomUUID(),
    heladoId,
    cantidad: 1,
  };
}

function nuevoExtra(): ExtraDraft {
  return {
    key: crypto.randomUUID(),
    concepto: "",
    monto: "",
  };
}

export function CompraForm({
  helados,
  heladoPreseleccionado,
  onSubmitCompra,
  onCancel,
}: Props) {
  const [lineas, setLineas] = useState<LineaDraft[]>([
    nuevaLinea(heladoPreseleccionado?.id ?? ""),
  ]);
  const [extras, setExtras] = useState<ExtraDraft[]>([]);

  const inversionEstimada = useMemo(() => {
    let total = 0;
    for (const linea of lineas) {
      const h = helados.find((x) => x.id === linea.heladoId);
      if (!h || !Number.isFinite(linea.cantidad) || linea.cantidad < 1) continue;
      total += h.precioCosto.pesos * linea.cantidad;
    }
    for (const extra of extras) {
      const monto = Number(extra.monto);
      if (Number.isFinite(monto) && monto > 0) total += monto;
    }
    return total;
  }, [lineas, extras, helados]);

  function actualizarLinea(
    key: string,
    patch: Partial<Pick<LineaDraft, "heladoId" | "cantidad">>
  ) {
    setLineas((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );
  }

  function quitarLinea(key: string) {
    setLineas((prev) =>
      prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)
    );
  }

  function actualizarExtra(
    key: string,
    patch: Partial<Pick<ExtraDraft, "concepto" | "monto">>
  ) {
    setExtras((prev) =>
      prev.map((e) => (e.key === key ? { ...e, ...patch } : e))
    );
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nota = String(fd.get("nota") ?? "") || undefined;

    const validas = lineas.filter((l) => l.heladoId && l.cantidad >= 1);
    if (validas.length === 0) return;

    const extrasValidos = extras
      .map((ex) => ({
        concepto: ex.concepto.trim(),
        monto: Number(ex.monto),
      }))
      .filter((ex) => ex.concepto && Number.isFinite(ex.monto) && ex.monto > 0);

    onSubmitCompra({
      lineas: validas.map((l) => ({
        heladoId: l.heladoId,
        cantidad: l.cantidad,
      })),
      extras: extrasValidos.length ? extrasValidos : undefined,
      nota,
    });
  }

  const idsUsados = new Set(lineas.map((l) => l.heladoId).filter(Boolean));

  return (
    <form className="form" onSubmit={handleSubmit}>


      <div className="factura-lineas">
        {lineas.map((linea) => (
          <div key={linea.key} className="factura-linea">
            <div className="factura-linea-row">
              <div className="field">
                <label htmlFor={`helado-${linea.key}`}>Helado</label>
                <select
                  id={`helado-${linea.key}`}
                  required
                  value={linea.heladoId}
                  onChange={(e) =>
                    actualizarLinea(linea.key, {
                      heladoId: e.target.value,
                    })
                  }
                >
                  <option value="" disabled>
                    Selecciona
                  </option>
                  {helados.map((h) => {
                    const ocupado =
                      idsUsados.has(h.id) && h.id !== linea.heladoId;
                    return (
                      <option key={h.id} value={h.id} disabled={ocupado}>
                        {h.nombre} · costo{" "}
                        {h.precioCosto.pesos.toLocaleString("es-CO", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                        {ocupado ? " (ya en factura)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`cant-${linea.key}`}>Cantidad</label>
                <input
                  id={`cant-${linea.key}`}
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={linea.cantidad}
                  onChange={(e) =>
                    actualizarLinea(linea.key, {
                      cantidad: Number(e.target.value),
                    })
                  }
                />
              </div>
              {lineas.length > 1 && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm factura-linea-row__quitar"
                  onClick={() => quitarLinea(linea.key)}
                >
                  Quitar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => setLineas((prev) => [...prev, nuevaLinea()])}
        disabled={lineas.length >= helados.length && helados.length > 0}
      >
        + Agregar helado
      </button>

      <div className="factura-extras">
        <p className="factura-extras__label">Extras de esta factura</p>
        <div className="factura-extras__acciones">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setExtras((prev) => [...prev, nuevoExtra()])}
          >
            + Extra de esta factura
          </button>
        </div>

        {extras.map((extra) => (
          <div key={extra.key} className="factura-linea">
            <div className="factura-linea-row">
              <div className="field">
                <label htmlFor={`concepto-${extra.key}`}>Concepto</label>
                <input
                  id={`concepto-${extra.key}`}
                  type="text"
                  required
                  placeholder="Ej. Afiche"
                  value={extra.concepto}
                  onChange={(e) =>
                    actualizarExtra(extra.key, { concepto: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label htmlFor={`monto-${extra.key}`}>Monto ($)</label>
                <input
                  id={`monto-${extra.key}`}
                  type="number"
                  min={0}
                  step={0.01}
                  required
                  placeholder="0"
                  value={extra.monto}
                  onChange={(e) =>
                    actualizarExtra(extra.key, { monto: e.target.value })
                  }
                />
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--sm factura-linea-row__quitar"
                onClick={() =>
                  setExtras((prev) => prev.filter((e) => e.key !== extra.key))
                }
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="caja-total" aria-live="polite">
        <span className="caja-total__label">Inversión estimada</span>
        <strong className="caja-total__value">
          {formatearMoneda(inversionEstimada)}
        </strong>
      </div>

      <div className="field">
        <label htmlFor="nota">Nota (opcional)</label>
        <textarea
          id="nota"
          name="nota"
          placeholder="Ej. Compra del lunes en el mercado…"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn--primary">
          Registrar factura
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
