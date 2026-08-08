import { useMemo, useState, type FormEvent } from "react";
import type { Helado } from "@inventario/domain";
import { formatearMoneda } from "../lib/inventario";

interface LineaDraft {
  key: string;
  heladoId: string;
  cantidad: number;
  precioEspecial: string;
}

interface Props {
  helados: Helado[];
  heladoPreseleccionado?: Helado | null;
  onSubmit: (data: {
    lineas: {
      heladoId: string;
      cantidad: number;
      precioVentaUnitario?: number;
    }[];
    nota?: string;
  }) => void;
  onCancel: () => void;
}

function nuevaLinea(heladoId = ""): LineaDraft {
  return {
    key: crypto.randomUUID(),
    heladoId,
    cantidad: 1,
    precioEspecial: "",
  };
}

export function VentaForm({
  helados,
  heladoPreseleccionado,
  onSubmit,
  onCancel,
}: Props) {
  const conStock = useMemo(() => helados.filter((h) => h.stock > 0), [helados]);
  const [lineas, setLineas] = useState<LineaDraft[]>([
    nuevaLinea(heladoPreseleccionado?.id ?? ""),
  ]);

  const totalCobrar = useMemo(() => {
    let total = 0;
    for (const linea of lineas) {
      const h = helados.find((x) => x.id === linea.heladoId);
      if (!h || !Number.isFinite(linea.cantidad) || linea.cantidad < 1) continue;
      const raw = linea.precioEspecial.trim();
      const precio =
        raw === ""
          ? h.precioVenta.pesos
          : Number.isFinite(Number(raw)) && Number(raw) >= 0
            ? Number(raw)
            : h.precioVenta.pesos;
      total += precio * linea.cantidad;
    }
    return total;
  }, [lineas, helados]);

  function actualizarLinea(
    key: string,
    patch: Partial<Pick<LineaDraft, "heladoId" | "cantidad" | "precioEspecial">>
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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validas = lineas.filter((l) => l.heladoId && l.cantidad >= 1);
    if (validas.length === 0) return;

    for (const linea of validas) {
      const h = helados.find((x) => x.id === linea.heladoId);
      if (!h) return;
      if (linea.cantidad > h.stock) {
        return;
      }
    }

    onSubmit({
      lineas: validas.map((l) => {
        const raw = l.precioEspecial.trim();
        return {
          heladoId: l.heladoId,
          cantidad: l.cantidad,
          precioVentaUnitario: raw !== "" ? Number(raw) : undefined,
        };
      }),
      nota:
        String(new FormData(e.currentTarget).get("nota") ?? "") || undefined,
    });
  }

  const idsUsados = new Set(lineas.map((l) => l.heladoId).filter(Boolean));
  const stockInsuficiente = lineas.some((l) => {
    const h = helados.find((x) => x.id === l.heladoId);
    return h && l.cantidad > h.stock;
  });

  return (
    <form className="form form--caja" onSubmit={handleSubmit}>
      <p className="hint">
        Ticket de venta: agrega varios helados distintos en la misma cobranza.
      </p>

      {helados.length > 0 && conStock.length === 0 && (
        <p className="hint">No hay stock. Registra una compra primero.</p>
      )}

      <div className="factura-lineas">
        {lineas.map((linea) => {
          const helado = helados.find((h) => h.id === linea.heladoId) ?? null;
          return (
            <div key={linea.key} className="factura-linea">
              <div className="factura-linea-row factura-linea-row--venta-helado">
                <div className="field">
                  <label htmlFor={`helado-${linea.key}`}>Helado</label>
                  <select
                    id={`helado-${linea.key}`}
                    required
                    value={linea.heladoId}
                    onChange={(e) =>
                      actualizarLinea(linea.key, {
                        heladoId: e.target.value,
                        precioEspecial: "",
                      })
                    }
                  >
                    <option value="" disabled>
                      Selecciona
                    </option>
                    {conStock.map((h) => {
                      const ocupado =
                        idsUsados.has(h.id) && h.id !== linea.heladoId;
                      return (
                        <option key={h.id} value={h.id} disabled={ocupado}>
                          {h.nombre} · {formatearMoneda(h.precioVenta.pesos)} ·
                          stock {h.stock}
                          {ocupado ? " (ya en ticket)" : ""}
                        </option>
                      );
                    })}
                  </select>
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
              <div className="factura-linea-row factura-linea-row--venta-datos">
                <div className="field">
                  <label htmlFor={`cant-${linea.key}`}>Cantidad</label>
                  <input
                    id={`cant-${linea.key}`}
                    type="number"
                    min={1}
                    max={helado?.stock ?? undefined}
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
                <div className="field">
                  <label htmlFor={`precio-${linea.key}`}>Precio / u</label>
                  <input
                    id={`precio-${linea.key}`}
                    type="number"
                    min={0}
                    step={0.01}
                    value={linea.precioEspecial}
                    onChange={(e) =>
                      actualizarLinea(linea.key, {
                        precioEspecial: e.target.value,
                      })
                    }
                    placeholder={
                      helado ? String(helado.precioVenta.pesos) : "Catálogo"
                    }
                  />
                </div>
              </div>
              {helado && linea.cantidad > helado.stock && (
                <p className="hint" style={{ marginTop: "0.35rem", color: "var(--danger)" }}>
                  Stock insuficiente (hay {helado.stock})
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => setLineas((prev) => [...prev, nuevaLinea()])}
        disabled={lineas.length >= conStock.length && conStock.length > 0}
      >
        + Agregar helado
      </button>

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
          disabled={
            conStock.length === 0 ||
            stockInsuficiente ||
            !lineas.some((l) => l.heladoId)
          }
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
