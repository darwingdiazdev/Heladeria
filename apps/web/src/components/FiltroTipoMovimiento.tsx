import { TipoMovimiento } from "@inventario/domain";

export type FiltroTipo = "TODOS" | TipoMovimiento;

export const OPCIONES_TIPO: { value: FiltroTipo; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: TipoMovimiento.ENTRADA, label: "Entrada" },
  { value: TipoMovimiento.SALIDA, label: "Venta" },
  { value: TipoMovimiento.CONSUMO_PERSONAL, label: "Consumo" },
  { value: TipoMovimiento.GASTO, label: "Gasto" },
  { value: TipoMovimiento.AJUSTE, label: "Ajuste" },
];

interface Props {
  valor: FiltroTipo;
  onChange: (valor: FiltroTipo) => void;
}

export function FiltroTipoMovimiento({ valor, onChange }: Props) {
  return (
    <div className="filtro-tipo" role="group" aria-label="Filtrar por tipo">
      <span className="filtro-tipo__label">Tipo</span>
      <div className="filtro-tipo__chips">
        {OPCIONES_TIPO.map((op) => (
          <button
            key={op.value}
            type="button"
            className={`btn btn--sm${valor === op.value ? " btn--primary" : " btn--ghost"}`}
            onClick={() => onChange(op.value)}
          >
            {op.label}
          </button>
        ))}
      </div>
    </div>
  );
}
