import {
  InventarioService,
  LocalStorageInventarioRepository,
  ResumenFinanciero,
} from "@inventario/domain";
import {
  crearClienteSupabase,
  hayCredencialesSupabase,
  SupabaseInventarioRepository,
} from "./supabaseRepository";

function crearServicio(): {
  service: InventarioService;
  modo: "supabase" | "localStorage";
} {
  if (hayCredencialesSupabase()) {
    const client = crearClienteSupabase(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    return {
      service: new InventarioService(new SupabaseInventarioRepository(client)),
      modo: "supabase",
    };
  }

  console.warn(
    "[inventario] Sin VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Usando localStorage."
  );
  return {
    service: new InventarioService(new LocalStorageInventarioRepository()),
    modo: "localStorage",
  };
}

const { service, modo } = crearServicio();

export const inventarioService = service;
export const modoPersistencia = modo;

export const resumenVacio = new ResumenFinanciero({
  totalIngresos: 0,
  totalGanancia: 0,
  totalDiezmo: 0,
  gananciaNeta: 0,
  unidadesVendidas: 0,
  totalEntradas: 0,
  totalSalidas: 0,
  totalInversion: 0,
  valorInventarioCosto: 0,
  valorInventarioVenta: 0,
});

export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valor);
}

export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fecha);
}
