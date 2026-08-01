import type { FormEvent } from "react";
import type { Helado } from "@inventario/domain";

interface Props {
  helado?: Helado | null;
  onSubmit: (data: {
    nombre: string;
    sabor: string;
    precioCosto: number;
    precioVenta: number;
    stockInicial?: number;
  }) => void;
  onCancel: () => void;
}

export function HeladoForm({ helado, onSubmit, onCancel }: Props) {
  const esEdicion = Boolean(helado);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nombre = String(fd.get("nombre") ?? "");
    const sabor = String(fd.get("sabor") ?? "");
    const precioCosto = Number(fd.get("precioCosto"));
    const precioVenta = Number(fd.get("precioVenta"));
    const stockInicial = fd.get("stockInicial")
      ? Number(fd.get("stockInicial"))
      : undefined;

    onSubmit({
      nombre,
      sabor,
      precioCosto,
      precioVenta,
      ...(esEdicion ? {} : { stockInicial: stockInicial ?? 0 }),
    });
  }

  const gananciaPrevista =
    helado != null
      ? helado.precioVenta.pesos - helado.precioCosto.pesos
      : null;

  return (
    <form className="form form--grid" onSubmit={handleSubmit}>
      <div className="field field--full">
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={helado?.nombre ?? ""}
          placeholder="Ej. Cono de vainilla"
          autoComplete="off"
        />
      </div>

      <div className="field field--full">
        <label htmlFor="sabor">Sabor</label>
        <input
          id="sabor"
          name="sabor"
          defaultValue={helado?.sabor ?? ""}
          placeholder="Ej. Vainilla, chocolate…"
          autoComplete="off"
        />
      </div>

      <div className="field">
        <label htmlFor="precioCosto">Precio de costo</label>
        <input
          id="precioCosto"
          name="precioCosto"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={helado?.precioCosto.pesos ?? ""}
          placeholder="0"
        />
      </div>

      <div className="field">
        <label htmlFor="precioVenta">Precio de venta</label>
        <input
          id="precioVenta"
          name="precioVenta"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={helado?.precioVenta.pesos ?? ""}
          placeholder="0"
        />
      </div>

      {!esEdicion && (
        <div className="field field--full">
          <label htmlFor="stockInicial">Stock inicial</label>
          <input
            id="stockInicial"
            name="stockInicial"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
          />
        </div>
      )}

      {gananciaPrevista != null && (
        <p className="hint field--full">
          Ganancia unitaria actual: {gananciaPrevista.toLocaleString("es-CO")}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn--primary">
          {esEdicion ? "Guardar cambios" : "Agregar helado"}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
