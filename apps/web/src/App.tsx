import { useMemo, useState } from "react";
import {
  Dinero,
  ResumenFinanciero,
  type Helado,
  type MovimientoInventario,
} from "@inventario/domain";
import { useInventario } from "./hooks/useInventario";
import { ResumenStats } from "./components/ResumenStats";
import { HeladoList } from "./components/HeladoList";
import { HeladoForm } from "./components/HeladoForm";
import { MovimientoList } from "./components/MovimientoList";
import { MovimientoForm } from "./components/MovimientoForm";
import { EditarMovimientoForm } from "./components/EditarMovimientoForm";
import { FiltrosMovimientos } from "./components/FiltrosMovimientos";
import { type RangoFechas } from "./components/FiltroFechas";
import {
  type FiltroTipo,
  OPCIONES_TIPO,
} from "./components/FiltroTipoMovimiento";
import { Paginacion, usePaginacion } from "./components/Paginacion";
import { Sheet } from "./components/Sheet";
import { format } from "date-fns";
import { es as esDateFns } from "date-fns/locale";
import { formatearMoneda } from "./lib/inventario";
import { estaEnRango, inicioDelDia, rangoMesActual } from "./lib/fechas";

type Vista = "inventario" | "movimientos" | "resumen";
type Modal =
  | { tipo: "crear" }
  | { tipo: "editar"; helado: Helado }
  | { tipo: "movimiento"; helado?: Helado }
  | { tipo: "editar-movimiento"; movimiento: MovimientoInventario }
  | null;

export function App() {
  const {
    helados,
    movimientos,
    loading,
    saving,
    error,
    limpiarError,
    agregarHelado,
    editarHelado,
    eliminarHelado,
    registrarMovimiento,
    editarMovimiento,
  } = useInventario();

  const [vista, setVista] = useState<Vista>("inventario");
  const [modal, setModal] = useState<Modal>(null);
  const [rango, setRango] = useState<RangoFechas>(() => rangoMesActual());
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("TODOS");

  const movimientosPorFecha = useMemo(
    () =>
      movimientos.filter((m) =>
        estaEnRango(m.fecha, rango.desde, rango.hasta)
      ),
    [movimientos, rango]
  );

  const movimientosFiltrados = useMemo(
    () =>
      movimientosPorFecha.filter(
        (m) => filtroTipo === "TODOS" || m.tipo === filtroTipo
      ),
    [movimientosPorFecha, filtroTipo]
  );

  const resumenPeriodo = useMemo(() => {
    let valorCosto = Dinero.cero();
    let valorVenta = Dinero.cero();
    for (const h of helados) {
      valorCosto = valorCosto.sumar(h.valorInventarioCosto());
      valorVenta = valorVenta.sumar(h.valorInventarioVenta());
    }
    return ResumenFinanciero.desdeMovimientos(
      movimientosPorFecha,
      valorCosto,
      valorVenta
    );
  }, [helados, movimientosPorFecha]);

  const etiquetaFechas = useMemo(() => {
    const desde = inicioDelDia(rango.desde);
    const hasta = inicioDelDia(rango.hasta);
    if (rango.desde === rango.hasta) {
      return format(desde, "d MMM yyyy", { locale: esDateFns });
    }
    return `${format(desde, "d MMM", { locale: esDateFns })} → ${format(hasta, "d MMM yyyy", { locale: esDateFns })}`;
  }, [rango]);

  const etiquetaPeriodo = useMemo(() => {
    const tipoLabel =
      OPCIONES_TIPO.find((o) => o.value === filtroTipo)?.label ?? "Todos";
    return filtroTipo === "TODOS"
      ? etiquetaFechas
      : `${etiquetaFechas} · ${tipoLabel}`;
  }, [etiquetaFechas, filtroTipo]);

  const resetHelados = String(helados.length);
  const resetMovs = `${rango.desde}|${rango.hasta}|${filtroTipo}|${movimientosFiltrados.length}`;

  const pagHelados = usePaginacion(helados, resetHelados);
  const pagMovs = usePaginacion(movimientosFiltrados, resetMovs);

  function cerrarModal() {
    setModal(null);
    limpiarError();
  }

  return (
    <div className="app">
      <header className="brand-bar">
        <div className="brand">
          <img
            className="brand__logo"
            src="/logo.png"
            alt="Helados"
            width={64}
            height={64}
          />
          <div className="brand__text">
            <span className="brand__name">Helados</span>
          </div>
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
            disabled={loading || saving}
          >
            + Movimiento
          </button>
        )}
      </header>

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
                <span className="panel__meta">{helados.length} total</span>
              </div>
              <HeladoList
                helados={pagHelados.items}
                onEditar={(h) => setModal({ tipo: "editar", helado: h })}
                onMovimiento={(h) => setModal({ tipo: "movimiento", helado: h })}
                onEliminar={(h) => {
                  void eliminarHelado(h.id);
                }}
              />
              <Paginacion
                pagina={pagHelados.pagina}
                totalPaginas={pagHelados.totalPaginas}
                total={pagHelados.total}
                porPagina={pagHelados.porPagina}
                onAnterior={() => pagHelados.setPagina((p) => p - 1)}
                onSiguiente={() => pagHelados.setPagina((p) => p + 1)}
              />
            </section>
          )}

          {vista === "movimientos" && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="panel__title">Movimientos</h2>
                <span className="panel__meta">
                  {movimientosFiltrados.length} filtrados
                </span>
              </div>

              <FiltrosMovimientos
                rango={rango}
                onRangoChange={setRango}
                filtroTipo={filtroTipo}
                onTipoChange={setFiltroTipo}
                resumenEtiqueta={etiquetaPeriodo}
              />

              <MovimientoList
                movimientos={pagMovs.items}
                onEditar={(m) =>
                  setModal({ tipo: "editar-movimiento", movimiento: m })
                }
              />
              <Paginacion
                pagina={pagMovs.pagina}
                totalPaginas={pagMovs.totalPaginas}
                total={pagMovs.total}
                porPagina={pagMovs.porPagina}
                onAnterior={() => pagMovs.setPagina((p) => p - 1)}
                onSiguiente={() => pagMovs.setPagina((p) => p + 1)}
              />
            </section>
          )}

          {vista === "resumen" && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="panel__title">Resumen del periodo</h2>
              </div>

              <FiltrosMovimientos
                rango={rango}
                onRangoChange={setRango}
                resumenEtiqueta={etiquetaFechas}
                mostrarTipo={false}
              />

              <p className="hint">
                Ingresos = ventas (precio cobrado, incl. especial) + consumo
                personal (precio de costo). La ganancia y el diezmo solo salen
                de las ventas. La inversión suma entradas de helados + gastos
                (cartel, cucharas, etc.). El valor del inventario es el stock
                actual.
              </p>
              <ResumenStats resumen={resumenPeriodo} periodo={etiquetaFechas} />
              <div className="resumen-grid" style={{ marginBottom: "1rem" }}>
                <div className="meta-block">
                  <span>Inversión del periodo</span>
                  <strong>
                    {formatearMoneda(resumenPeriodo.totalInversion.pesos)}
                  </strong>
                </div>
                <div className="meta-block meta-block--ganancia">
                  <span>Ingresos del periodo</span>
                  <strong>
                    {formatearMoneda(resumenPeriodo.totalIngresos.pesos)}
                  </strong>
                </div>
                <div className="meta-block">
                  <span>Valor inventario (costo)</span>
                  <strong>
                    {formatearMoneda(resumenPeriodo.valorInventarioCosto.pesos)}
                  </strong>
                </div>
                <div className="meta-block">
                  <span>Entradas / Salidas</span>
                  <strong>
                    {resumenPeriodo.totalEntradas} / {resumenPeriodo.totalSalidas}
                  </strong>
                </div>
              </div>
              <div className="list">
                <div className="helado-item">
                  <div className="resumen-grid">
                    <div className="meta-block">
                      <span>Ganancia bruta</span>
                      <strong>
                        {formatearMoneda(resumenPeriodo.totalGanancia.pesos)}
                      </strong>
                    </div>
                    <div className="meta-block">
                      <span>Diezmo (solo ventas)</span>
                      <strong>
                        {formatearMoneda(resumenPeriodo.totalDiezmo.pesos)}
                      </strong>
                    </div>
                    <div className="meta-block">
                      <span>Ganancia neta</span>
                      <strong>
                        {formatearMoneda(resumenPeriodo.gananciaNeta.pesos)}
                      </strong>
                    </div>
                    <div className="meta-block">
                      <span>Unidades vendidas</span>
                      <strong>{resumenPeriodo.unidadesVendidas}</strong>
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

      {modal?.tipo === "editar-movimiento" && (
        <Sheet title="Editar movimiento" onClose={cerrarModal}>
          <EditarMovimientoForm
            movimiento={modal.movimiento}
            onCancel={cerrarModal}
            onSubmit={(data) => {
              void (async () => {
                const ok = await editarMovimiento(modal.movimiento.id, data);
                if (ok) cerrarModal();
              })();
            }}
          />
        </Sheet>
      )}
    </div>
  );
}
