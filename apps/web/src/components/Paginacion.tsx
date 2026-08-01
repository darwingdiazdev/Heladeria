import { useEffect, useMemo, useState } from "react";

const POR_PAGINA = 10;

export function usePaginacion<T>(items: T[], resetKey: string) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(items.length / POR_PAGINA));

  useEffect(() => {
    setPagina(1);
  }, [resetKey]);

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [pagina, totalPaginas]);

  const paginaItems = useMemo(() => {
    const inicio = (pagina - 1) * POR_PAGINA;
    return items.slice(inicio, inicio + POR_PAGINA);
  }, [items, pagina]);

  return {
    pagina,
    totalPaginas,
    total: items.length,
    items: paginaItems,
    porPagina: POR_PAGINA,
    setPagina,
  };
}

export function Paginacion({
  pagina,
  totalPaginas,
  total,
  porPagina,
  onAnterior,
  onSiguiente,
}: {
  pagina: number;
  totalPaginas: number;
  total: number;
  porPagina: number;
  onAnterior: () => void;
  onSiguiente: () => void;
}) {
  if (total <= porPagina) return null;

  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);

  return (
    <div className="paginacion">
      <span className="paginacion__info">
        {desde}–{hasta} de {total}
      </span>
      <div className="paginacion__btns">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onAnterior}
          disabled={pagina <= 1}
        >
          Anterior
        </button>
        <span className="paginacion__pagina">
          {pagina}/{totalPaginas}
        </span>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onSiguiente}
          disabled={pagina >= totalPaginas}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
