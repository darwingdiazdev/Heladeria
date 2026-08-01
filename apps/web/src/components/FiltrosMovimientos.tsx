import { useState } from "react";
import { FiltroFechas, type RangoFechas } from "./FiltroFechas";
import { FiltroTipoMovimiento, type FiltroTipo } from "./FiltroTipoMovimiento";

interface Props {
  rango: RangoFechas;
  onRangoChange: (rango: RangoFechas) => void;
  filtroTipo?: FiltroTipo;
  onTipoChange?: (tipo: FiltroTipo) => void;
  resumenEtiqueta: string;
  /** Si es false, solo muestra filtro de fechas (útil en Resumen). */
  mostrarTipo?: boolean;
}

export function FiltrosMovimientos({
  rango,
  onRangoChange,
  filtroTipo = "TODOS",
  onTipoChange,
  resumenEtiqueta,
  mostrarTipo = true,
}: Props) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="filtros-mov">
      <button
        type="button"
        className="filtros-mov__toggle"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
      >
        <span>
          <span className="filtros-mov__toggle-label">Filtros</span>
          <strong className="filtros-mov__toggle-value">{resumenEtiqueta}</strong>
        </span>
        <span className="filtros-mov__chevron" aria-hidden="true">
          {abierto ? "▲" : "▼"}
        </span>
      </button>

      <div className={`filtros-mov__panel${abierto ? " filtros-mov__panel--abierto" : ""}`}>
        <FiltroFechas rango={rango} onChange={onRangoChange} />
        {mostrarTipo && onTipoChange && (
          <FiltroTipoMovimiento valor={filtroTipo} onChange={onTipoChange} />
        )}
      </div>
    </div>
  );
}
