import { useCallback, useEffect, useState } from "react";
import {
  guardarTasaBcv,
  leerTasaBcv,
  type TasaBcvGuardada,
} from "../lib/tasaBcv";

export function useTasaBcv() {
  const [data, setData] = useState<TasaBcvGuardada | null>(null);

  useEffect(() => {
    setData(leerTasaBcv());
  }, []);

  const actualizarTasa = useCallback((tasa: number) => {
    const guardada = guardarTasaBcv(tasa);
    setData(guardada);
    return guardada;
  }, []);

  return {
    tasa: data?.tasa ?? null,
    actualizadoEn: data?.actualizadoEn ?? null,
    actualizarTasa,
  };
}
