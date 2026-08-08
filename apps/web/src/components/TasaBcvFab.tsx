import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { es as esDateFns } from "date-fns/locale";
import { Sheet } from "./Sheet";
import {
  formatearBs,
  formatearTasa,
  usdABs,
} from "../lib/tasaBcv";

interface Props {
  tasa: number | null;
  actualizadoEn: string | null;
  onActualizarTasa: (tasa: number) => void;
}

interface Posicion {
  x: number;
  y: number;
}

const CLAVE_POS = "inventario-helados-tasa-fab-pos";
const FAB_SIZE = 60;
const MARGIN = 8;
const DRAG_THRESHOLD = 18;

function posicionPorDefecto(): Posicion {
  if (typeof window === "undefined") {
    return { x: 16, y: 16 };
  }
  return {
    x: Math.max(MARGIN, window.innerWidth - FAB_SIZE - 16),
    y: Math.max(MARGIN, window.innerHeight - FAB_SIZE - 96),
  };
}

function acotar(pos: Posicion): Posicion {
  if (typeof window === "undefined") return pos;
  const maxX = Math.max(MARGIN, window.innerWidth - FAB_SIZE - MARGIN);
  const maxY = Math.max(MARGIN, window.innerHeight - FAB_SIZE - MARGIN);
  return {
    x: Math.min(maxX, Math.max(MARGIN, pos.x)),
    y: Math.min(maxY, Math.max(MARGIN, pos.y)),
  };
}

function leerPosicion(): Posicion {
  if (typeof localStorage === "undefined") return posicionPorDefecto();
  try {
    const raw = localStorage.getItem(CLAVE_POS);
    if (!raw) return posicionPorDefecto();
    const parsed = JSON.parse(raw) as Posicion;
    if (!Number.isFinite(parsed.x) || !Number.isFinite(parsed.y)) {
      return posicionPorDefecto();
    }
    return acotar(parsed);
  } catch {
    return posicionPorDefecto();
  }
}

function guardarPosicion(pos: Posicion) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CLAVE_POS, JSON.stringify(pos));
}

export function TasaBcvFab({ tasa, actualizadoEn, onActualizarTasa }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [vistaPanel, setVistaPanel] = useState<"conversor" | "tasa">("conversor");
  const [usd, setUsd] = useState("");
  const [nuevaTasa, setNuevaTasa] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pos, setPos] = useState<Posicion>(() => leerPosicion());
  const [arrastrando, setArrastrando] = useState(false);
  const [montado, setMontado] = useState(false);

  const posRef = useRef(pos);
  const suppressClickRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const equivalente = useMemo(() => {
    if (tasa === null) return 0;
    const monto = Number(usd);
    if (!Number.isFinite(monto) || monto < 0) return 0;
    return usdABs(monto, tasa);
  }, [usd, tasa]);

  const reacomodar = useCallback(() => {
    setPos((p) => {
      const next = acotar(p);
      guardarPosicion(next);
      posRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", reacomodar);
    return () => window.removeEventListener("resize", reacomodar);
  }, [reacomodar]);

  function abrir() {
    setError(null);
    setVistaPanel("conversor");
    setNuevaTasa(tasa !== null ? String(tasa) : "");
    setAbierto(true);
  }

  function guardarTasa(e: FormEvent) {
    e.preventDefault();
    const n = Number(nuevaTasa);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Ingresa una tasa válida mayor que 0");
      return;
    }
    try {
      onActualizarTasa(n);
      setError(null);
      setVistaPanel("conversor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    }
  }

  function onPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    suppressClickRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: posRef.current.x,
      originY: posRef.current.y,
      moved: false,
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    if (!drag.moved) {
      drag.moved = true;
      setArrastrando(true);
    }

    const next = acotar({
      x: drag.originX + dx,
      y: drag.originY + dy,
    });
    posRef.current = next;
    setPos(next);
  }

  function onPointerUp(e: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    const fueDrag = drag.moved;
    dragRef.current = null;
    setArrastrando(false);

    // Evita que el click nativo posterior duplique o anule la acción.
    suppressClickRef.current = true;

    if (fueDrag) {
      const next = acotar(posRef.current);
      posRef.current = next;
      setPos(next);
      guardarPosicion(next);
      return;
    }

    abrir();
  }

  function onClick() {
    // Teclado (Enter/Espacio) o casos sin pointer: abrir.
    // Tras pointer, suppressClick evita doble apertura / clic fantasma.
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    abrir();
  }

  const etiquetaActualizacion = actualizadoEn
    ? format(new Date(actualizadoEn), "d MMM yyyy · HH:mm", {
        locale: esDateFns,
      })
    : null;

  if (!montado) return null;

  return createPortal(
    <>
      {!abierto && (
        <button
          type="button"
          className={`tasa-fab${arrastrando ? " tasa-fab--dragging" : ""}`}
          style={{ left: pos.x, top: pos.y }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onClick}
          aria-label="Abrir conversor tasa BCV. Arrastra para mover."
          title="Tasa BCV · arrastra para mover"
        >
          <span className="tasa-fab__label">$</span>
        </button>
      )}

      {abierto && (
        <Sheet title="Tasa BCV" onClose={() => setAbierto(false)}>
          <div className="tasa-panel">
            <div className="tasa-panel__tabs" role="tablist" aria-label="Secciones tasa BCV">
              <button
                type="button"
                role="tab"
                aria-selected={vistaPanel === "conversor"}
                className={`tasa-panel__tab${vistaPanel === "conversor" ? " tasa-panel__tab--active" : ""}`}
                onClick={() => setVistaPanel("conversor")}
              >
                Conversor
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={vistaPanel === "tasa"}
                className={`tasa-panel__tab${vistaPanel === "tasa" ? " tasa-panel__tab--active" : ""}`}
                onClick={() => {
                  setError(null);
                  setNuevaTasa(tasa !== null ? String(tasa) : "");
                  setVistaPanel("tasa");
                }}
              >
                Actualizar tasa
              </button>
            </div>

            <div className="tasa-panel__hoy">
              <span className="tasa-panel__hoy-label">Tasa hoy</span>
              <strong className="tasa-panel__hoy-valor">
                {tasa !== null ? formatearTasa(tasa) : "Sin tasa configurada"}
              </strong>
              {etiquetaActualizacion && (
                <span className="tasa-panel__hoy-meta">
                  Actualizada: {etiquetaActualizacion}
                </span>
              )}
            </div>

            {vistaPanel === "conversor" ? (
              <>
                <div className="field">
                  <label htmlFor="montoUsd">Monto en dólares (USD)</label>
                  <input
                    id="montoUsd"
                    type="number"
                    min={0}
                    step={0.01}
                    value={usd}
                    onChange={(e) => setUsd(e.target.value)}
                    placeholder="$ 0.00"
                    disabled={tasa === null}
                    autoFocus
                  />
                </div>
                <div className="tasa-panel__resultado">
                  <span className="tasa-panel__resultado-label">
                    Equivalente Bs.S
                  </span>
                  <strong className="tasa-panel__resultado-valor">
                    {tasa === null ? "—" : formatearBs(equivalente)}
                  </strong>
                </div>
              </>
            ) : (
              <>
                <p className="hint">
                  Actualiza la tasa Bs.S por dólar del día (BCV).
                </p>
                <form className="form" onSubmit={guardarTasa}>
                  <div className="field">
                    <label htmlFor="tasaBcv">Tasa (Bs.S / USD)</label>
                    <input
                      id="tasaBcv"
                      type="number"
                      min={0.01}
                      step={0.01}
                      required
                      value={nuevaTasa}
                      onChange={(e) => setNuevaTasa(e.target.value)}
                      placeholder="Ej. 000.00"
                      autoFocus
                    />
                  </div>
                  {error && (
                    <p className="hint" style={{ color: "var(--danger)" }}>
                      {error}
                    </p>
                  )}
                  <button type="submit" className="btn btn--primary">
                    Guardar tasa
                  </button>
                </form>
              </>
            )}
          </div>
        </Sheet>
      )}
    </>,
    document.body
  );
}
