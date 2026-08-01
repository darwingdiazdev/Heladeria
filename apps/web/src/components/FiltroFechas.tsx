import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { format } from "date-fns";
import { es as esDateFns } from "date-fns/locale";
import "react-day-picker/style.css";
import {
  aFechaInput,
  inicioDelDia,
  rangoHoy,
  rangoMesActual,
  rangoSemanaActual,
} from "../lib/fechas";

export interface RangoFechas {
  desde: string;
  hasta: string;
}

interface Props {
  rango: RangoFechas;
  onChange: (rango: RangoFechas) => void;
}

function etiquetaFecha(fechaYYYYMMDD: string): string {
  return format(inicioDelDia(fechaYYYYMMDD), "d MMM yyyy", {
    locale: esDateFns,
  });
}

export function FiltroFechas({ rango, onChange }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<"desde" | "hasta">("desde");
  const mes = rangoMesActual();
  const semana = rangoSemanaActual();
  const hoy = rangoHoy();

  const selected = useMemo(
    () => inicioDelDia(editando === "desde" ? rango.desde : rango.hasta),
    [editando, rango]
  );

  const rangoVisual = useMemo(
    () => ({
      from: inicioDelDia(rango.desde),
      to: inicioDelDia(rango.hasta),
    }),
    [rango]
  );

  function esActivo(preset: RangoFechas) {
    return rango.desde === preset.desde && rango.hasta === preset.hasta;
  }

  function aplicarPreset(preset: RangoFechas) {
    onChange(preset);
    setAbierto(false);
  }

  function abrirPara(cual: "desde" | "hasta") {
    setEditando(cual);
    setAbierto(true);
  }

  function onSelect(day: Date | undefined) {
    if (!day) return;
    const elegida = aFechaInput(day);

    if (editando === "desde") {
      const hasta = elegida > rango.hasta ? elegida : rango.hasta;
      onChange({ desde: elegida, hasta });
      setEditando("hasta");
      return;
    }

    const desde = elegida < rango.desde ? elegida : rango.desde;
    onChange({ desde, hasta: elegida });
  }

  return (
    <div className="filtro-fechas">
      <div className="filtro-fechas__presets" role="group" aria-label="Periodos rápidos">
        <button
          type="button"
          className={`btn btn--sm${esActivo(hoy) ? " btn--primary" : " btn--ghost"}`}
          onClick={() => aplicarPreset(hoy)}
        >
          Hoy
        </button>
        <button
          type="button"
          className={`btn btn--sm${esActivo(semana) ? " btn--primary" : " btn--ghost"}`}
          onClick={() => aplicarPreset(semana)}
        >
          Semana
        </button>
        <button
          type="button"
          className={`btn btn--sm${esActivo(mes) ? " btn--primary" : " btn--ghost"}`}
          onClick={() => aplicarPreset(mes)}
        >
          Mes
        </button>
      </div>

      <div className="filtro-fechas__rango">
        <button
          type="button"
          className={`filtro-fechas__fecha${editando === "desde" && abierto ? " filtro-fechas__fecha--activa" : ""}`}
          onClick={() => abrirPara("desde")}
        >
          <span className="filtro-fechas__resumen-label">Fecha inicial</span>
          <strong>{etiquetaFecha(rango.desde)}</strong>
        </button>
        <span className="filtro-fechas__flecha" aria-hidden="true">
          →
        </span>
        <button
          type="button"
          className={`filtro-fechas__fecha${editando === "hasta" && abierto ? " filtro-fechas__fecha--activa" : ""}`}
          onClick={() => abrirPara("hasta")}
        >
          <span className="filtro-fechas__resumen-label">Fecha final</span>
          <strong>{etiquetaFecha(rango.hasta)}</strong>
        </button>
      </div>

      {abierto && (
        <div className="filtro-fechas__calendario">
          <p className="filtro-fechas__hint">
            {editando === "desde"
              ? "Elige la fecha inicial del rango"
              : "Elige la fecha final del rango"}
          </p>
          <DayPicker
            mode="single"
            required
            selected={selected}
            onSelect={onSelect}
            locale={es}
            weekStartsOn={1}
            numberOfMonths={1}
            defaultMonth={selected}
            className="calendario-app"
            disabled={{ after: new Date() }}
            modifiers={{
              rango: { from: rangoVisual.from, to: rangoVisual.to },
            }}
            modifiersClassNames={{
              rango: "calendario-app__en-rango",
            }}
          />
          <div className="filtro-fechas__cal-actions">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setAbierto(false)}
            >
              Cerrar
            </button>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => setAbierto(false)}
            >
              Aplicar rango
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
