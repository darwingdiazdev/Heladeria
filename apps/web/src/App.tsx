import { useMemo, useState } from "react";
import {
  Dinero,
  ResumenFinanciero,
  TipoMovimiento,
  type Helado,
  type MovimientoInventario,
} from "@inventario/domain";
import { useInventario } from "./hooks/useInventario";
import { ResumenComprasList } from "./components/ResumenComprasList";
import { HeladoList } from "./components/HeladoList";
import { HeladoForm } from "./components/HeladoForm";
import { CompraForm } from "./components/CompraForm";
import { CompraList } from "./components/CompraList";
import { VentaForm } from "./components/VentaForm";
import { VentaList } from "./components/VentaList";
import { EditarMovimientoForm } from "./components/EditarMovimientoForm";
import { FiltrosMovimientos } from "./components/FiltrosMovimientos";
import { type RangoFechas } from "./components/FiltroFechas";
import { Paginacion, usePaginacion } from "./components/Paginacion";
import { Sheet } from "./components/Sheet";
import { format } from "date-fns";
import { es as esDateFns } from "date-fns/locale";
import { estaEnRango, inicioDelDia, rangoMesActual } from "./lib/fechas";

type Vista = "inventario" | "compras" | "ventas" | "resumen";
type Modal =
  | { tipo: "crear" }
  | { tipo: "editar"; helado: Helado }
  | { tipo: "compra"; helado?: Helado }
  | { tipo: "venta"; helado?: Helado }
  | { tipo: "editar-movimiento"; movimiento: MovimientoInventario }
  | null;

const TABS: { id: Vista; label: string }[] = [
  { id: "inventario", label: "Inventario" },
  { id: "compras", label: "Compras" },
  { id: "ventas", label: "Ventas" },
  { id: "resumen", label: "Resumen" },
];

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
    registrarCompra,
    registrarVenta,
    editarMovimiento,
    diezmosEntregados,
    marcarDiezmoEntregado,
  } = useInventario();

  const [vista, setVista] = useState<Vista>("inventario");
  const [modal, setModal] = useState<Modal>(null);
  const [rango, setRango] = useState<RangoFechas>(() => rangoMesActual());

  const movimientosPorFecha = useMemo(
    () =>
      movimientos.filter((m) =>
        estaEnRango(m.fecha, rango.desde, rango.hasta)
      ),
    [movimientos, rango]
  );

  const comprasFiltradas = useMemo(
    () =>
      movimientosPorFecha.filter(
        (m) =>
          m.tipo === TipoMovimiento.ENTRADA || m.tipo === TipoMovimiento.GASTO
      ),
    [movimientosPorFecha]
  );

  const ventasFiltradas = useMemo(
    () =>
      movimientosPorFecha.filter((m) => m.tipo === TipoMovimiento.SALIDA),
    [movimientosPorFecha]
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
      valorVenta,
      movimientos
    );
  }, [helados, movimientosPorFecha, movimientos]);

  const etiquetaFechas = useMemo(() => {
    const desde = inicioDelDia(rango.desde);
    const hasta = inicioDelDia(rango.hasta);
    if (rango.desde === rango.hasta) {
      return format(desde, "d MMM yyyy", { locale: esDateFns });
    }
    return `${format(desde, "d MMM", { locale: esDateFns })} → ${format(hasta, "d MMM yyyy", { locale: esDateFns })}`;
  }, [rango]);

  const resetHelados = String(helados.length);
  const pagHelados = usePaginacion(helados, resetHelados);

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
            src="/brand.png"
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
        {vista === "compras" && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setModal({ tipo: "compra" })}
            disabled={loading || saving}
          >
            + Compra
          </button>
        )}
        {vista === "ventas" && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setModal({ tipo: "venta" })}
            disabled={loading || saving}
          >
            + Venta
          </button>
        )}
      </header>

      <nav className="tabs" aria-label="Secciones">
        {TABS.map(({ id, label }) => (
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
                onMovimiento={(h) => setModal({ tipo: "venta", helado: h })}
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

          {vista === "compras" && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="panel__title">Compras</h2>
                <span className="panel__meta">
                  Facturas y gastos del periodo
                </span>
              </div>

              <FiltrosMovimientos
                rango={rango}
                onRangoChange={setRango}
                resumenEtiqueta={etiquetaFechas}
                mostrarTipo={false}
              />

              <CompraList
                movimientos={comprasFiltradas}
                vacioMensaje="Sin compras en este periodo. Pulsa + Compra."
                onEditarGasto={(m) =>
                  setModal({ tipo: "editar-movimiento", movimiento: m })
                }
              />
            </section>
          )}

          {vista === "ventas" && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="panel__title">Ventas · Caja</h2>
                <span className="panel__meta">
                  {ventasFiltradas.length} en el periodo
                </span>
              </div>

              <FiltrosMovimientos
                rango={rango}
                onRangoChange={setRango}
                resumenEtiqueta={etiquetaFechas}
                mostrarTipo={false}
              />

              <p className="hint">
                Cada ticket puede incluir varios helados distintos. El diezmo se
                calcula en Resumen por factura de compra.
              </p>

              <VentaList
                movimientos={ventasFiltradas}
                vacioMensaje="Sin ventas en este periodo. Pulsa + Venta para cobrar."
                onEditar={(m) =>
                  setModal({ tipo: "editar-movimiento", movimiento: m })
                }
              />
            </section>
          )}

          {vista === "resumen" && (
            <section className="panel">
              <div className="panel__head">
                <h2 className="panel__title">Resumen por factura</h2>
                <span className="panel__meta">
                  {resumenPeriodo.compras.length} facturas
                </span>
              </div>

              <FiltrosMovimientos
                rango={rango}
                onRangoChange={setRango}
                resumenEtiqueta={etiquetaFechas}
                mostrarTipo={false}
              />

              <ResumenComprasList
                compras={resumenPeriodo.compras}
                diezmosEntregados={diezmosEntregados}
                saving={saving}
                onToggleDiezmo={(compraId, entregado) => {
                  void marcarDiezmoEntregado(compraId, entregado);
                }}
              />
            </section>
          )}
        </>
      )}

      <nav className="bottom-nav" aria-label="Navegación móvil">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`bottom-nav__btn${vista === id ? " bottom-nav__btn--active" : ""}`}
            onClick={() => setVista(id)}
          >
            {label}
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

      {modal?.tipo === "compra" && (
        <Sheet title="Registrar compra (factura)" onClose={cerrarModal}>
          <CompraForm
            helados={helados}
            heladoPreseleccionado={modal.helado}
            onCancel={cerrarModal}
            onSubmitCompra={(data) => {
              void (async () => {
                const ok = await registrarCompra(data);
                if (ok) {
                  cerrarModal();
                  setVista("compras");
                }
              })();
            }}
          />
        </Sheet>
      )}

      {modal?.tipo === "venta" && (
        <Sheet title="Caja · Cobrar venta" onClose={cerrarModal}>
          <VentaForm
            helados={helados}
            heladoPreseleccionado={modal.helado}
            onCancel={cerrarModal}
            onSubmit={(data) => {
              void (async () => {
                const ok = await registrarVenta(data);
                if (ok) {
                  cerrarModal();
                  setVista("ventas");
                }
              })();
            }}
          />
        </Sheet>
      )}

      {modal?.tipo === "editar-movimiento" && (
        <Sheet title="Editar registro" onClose={cerrarModal}>
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
