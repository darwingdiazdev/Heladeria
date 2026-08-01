import { useState } from "react";
import type { Helado } from "@inventario/domain";
import { useInventario } from "./hooks/useInventario";
import { ResumenStats } from "./components/ResumenStats";
import { HeladoList } from "./components/HeladoList";
import { HeladoForm } from "./components/HeladoForm";
import { MovimientoList } from "./components/MovimientoList";
import { MovimientoForm } from "./components/MovimientoForm";
import { Sheet } from "./components/Sheet";
import { formatearMoneda } from "./lib/inventario";

type Vista = "inventario" | "movimientos" | "resumen";
type Modal =
  | { tipo: "crear" }
  | { tipo: "editar"; helado: Helado }
  | { tipo: "movimiento"; helado?: Helado }
  | null;

export function App() {
  const {
    helados,
    movimientos,
    resumen,
    loading,
    saving,
    error,
    modoPersistencia,
    limpiarError,
    agregarHelado,
    editarHelado,
    eliminarHelado,
    registrarMovimiento,
  } = useInventario();

  const [vista, setVista] = useState<Vista>("inventario");
  const [modal, setModal] = useState<Modal>(null);

  function cerrarModal() {
    setModal(null);
    limpiarError();
  }

  return (
    <div className="app">
      <header className="brand-bar">
        <div className="brand">
          <span className="brand__name">Heladería</span>
          <span className="brand__tag">
            Inventario · ganancia · diezmo
            <span className="persist-badge">
              {modoPersistencia === "supabase" ? "Supabase" : "Local"}
            </span>
          </span>
        </div>
        {vista === "inventario" && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setModal({ tipo: "crear" })}
            disabled={loading || saving}
          >
            + Helado
          </button>
        )}
        {vista === "movimientos" && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setModal({ tipo: "movimiento" })}
            disabled={helados.length === 0 || loading || saving}
          >
            + Movimiento
          </button>
        )}
      </header>

      <ResumenStats resumen={resumen} />

      <nav className="tabs" aria-label="Secciones">
        {(
          [
            ["inventario", "Inventario"],
            ["movimientos", "Movimientos"],
            ["resumen", "Resumen"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab${vista === id ? " tab--active" : ""}`}
            onClick={() => setVista(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="empty">Cargando inventario…</div>
      ) : (
        <>
          {vista === "inventario" && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="panel__title">Helados</h2>
              </div>
              <HeladoList
                helados={helados}
                onEditar={(h) => setModal({ tipo: "editar", helado: h })}
                onMovimiento={(h) => setModal({ tipo: "movimiento", helado: h })}
                onEliminar={(h) => {
                  void eliminarHelado(h.id);
                }}
              />
            </section>
          )}

          {vista === "movimientos" && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="panel__title">Movimientos</h2>
              </div>
              <MovimientoList movimientos={movimientos} />
            </section>
          )}

          {vista === "resumen" && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="panel__title">Resumen financiero</h2>
              </div>
              <p className="hint">
                La inversión suma el costo de cada entrada (cantidad × precio de
                costo). La ganancia y el diezmo (10%) solo en salidas por venta.
                El consumo personal sale al costo y no genera ganancia ni
                diezmo.
              </p>
              <div className="helado-item__meta" style={{ marginBottom: "1rem" }}>
                <div className="meta-block meta-block--ganancia">
                  <span>Inversión total (entradas)</span>
                  <strong>
                    {formatearMoneda(resumen.totalInversion.pesos)}
                  </strong>
                </div>
                <div className="meta-block">
                  <span>Valor inventario (costo)</span>
                  <strong>
                    {formatearMoneda(resumen.valorInventarioCosto.pesos)}
                  </strong>
                </div>
                <div className="meta-block">
                  <span>Valor inventario (venta)</span>
                  <strong>
                    {formatearMoneda(resumen.valorInventarioVenta.pesos)}
                  </strong>
                </div>
                <div className="meta-block">
                  <span>Entradas / Salidas</span>
                  <strong>
                    {resumen.totalEntradas} / {resumen.totalSalidas}
                  </strong>
                </div>
              </div>
              <div className="list">
                <div className="helado-item">
                  <div className="helado-item__meta">
                    <div className="meta-block">
                      <span>Ganancia bruta</span>
                      <strong>
                        {formatearMoneda(resumen.totalGanancia.pesos)}
                      </strong>
                    </div>
                    <div className="meta-block">
                      <span>Diezmo (solo ventas)</span>
                      <strong>
                        {formatearMoneda(resumen.totalDiezmo.pesos)}
                      </strong>
                    </div>
                    <div className="meta-block">
                      <span>Ganancia neta</span>
                      <strong>
                        {formatearMoneda(resumen.gananciaNeta.pesos)}
                      </strong>
                    </div>
                    <div className="meta-block">
                      <span>Unidades vendidas</span>
                      <strong>{resumen.unidadesVendidas}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <nav className="bottom-nav" aria-label="Navegación móvil">
        {(
          [
            ["inventario", "Inv"],
            ["movimientos", "Mov"],
            ["resumen", "Fin"],
          ] as const
        ).map(([id, short]) => (
          <button
            key={id}
            type="button"
            className={`bottom-nav__btn${vista === id ? " bottom-nav__btn--active" : ""}`}
            onClick={() => setVista(id)}
          >
            <span aria-hidden="true">{short}</span>
            <span>
              {id === "inventario"
                ? "Inventario"
                : id === "movimientos"
                  ? "Movimientos"
                  : "Resumen"}
            </span>
          </button>
        ))}
      </nav>

      {modal?.tipo === "crear" && (
        <Sheet title="Nuevo helado" onClose={cerrarModal}>
          <HeladoForm
            onCancel={cerrarModal}
            onSubmit={(data) => {
              void (async () => {
                const ok = await agregarHelado({
                  nombre: data.nombre,
                  sabor: data.sabor,
                  precioCosto: data.precioCosto,
                  precioVenta: data.precioVenta,
                  stockInicial: data.stockInicial,
                });
                if (ok) cerrarModal();
              })();
            }}
          />
        </Sheet>
      )}

      {modal?.tipo === "editar" && (
        <Sheet title="Editar helado" onClose={cerrarModal}>
          <HeladoForm
            helado={modal.helado}
            onCancel={cerrarModal}
            onSubmit={(data) => {
              void (async () => {
                const ok = await editarHelado(modal.helado.id, {
                  nombre: data.nombre,
                  sabor: data.sabor,
                  precioCosto: data.precioCosto,
                  precioVenta: data.precioVenta,
                });
                if (ok) cerrarModal();
              })();
            }}
          />
        </Sheet>
      )}

      {modal?.tipo === "movimiento" && (
        <Sheet title="Registrar movimiento" onClose={cerrarModal}>
          <MovimientoForm
            helados={helados}
            heladoPreseleccionado={modal.helado}
            onCancel={cerrarModal}
            onSubmit={(data) => {
              void (async () => {
                const ok = await registrarMovimiento(data);
                if (ok) {
                  cerrarModal();
                  setVista("movimientos");
                }
              })();
            }}
          />
        </Sheet>
      )}
    </div>
  );
}
