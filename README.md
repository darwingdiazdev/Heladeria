# Inventario de Helados

Monorepo Turborepo orientado a objetos para gestionar inventario de helados, movimientos, ganancias y diezmo (10%).

## Estructura

```
apps/web              → App React (Vite) responsive
packages/domain       → Dominio OOP (Helado, Movimiento, Inventario, Diezmo)
supabase/schema.sql   → Tablas y policies para Supabase
```

## Requisitos

- Node.js 18+
- pnpm 9+
- Cuenta gratis en [Supabase](https://supabase.com) (para la nube)

## Cómo correr en local

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Edita .env.local con tu URL y anon key de Supabase
pnpm dev
```

Abre `http://localhost:5173`

Sin variables de Supabase, la app usa `localStorage` como fallback.

## Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** → New query
3. Pega y ejecuta el contenido de `supabase/schema.sql`
4. En **Project Settings → API** copia:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
5. Guárdalas en `apps/web/.env.local`
6. Reinicia `pnpm dev`
7. En la app debe verse la etiqueta **Supabase** junto al subtítulo

## Desplegar en Render

1. Sube el repo a GitHub
2. Render → **New → Static Site**
3. Build command:

```bash
pnpm install && pnpm --filter @inventario/domain build && pnpm --filter @inventario/web build
```

4. Publish directory: `apps/web/dist`
5. Environment variables (las mismas de Supabase):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Funcionalidades

- Agregar y editar helados (precio de costo, precio de venta, stock)
- Registrar movimientos de inventario (entrada, salida, ajuste)
- Cálculo automático de ganancia unitaria y total
- Diezmo: 10% de la ganancia de cada venta
- Persistencia en Supabase (Postgres) o localStorage
- Diseño responsive para móvil

## Dominio OOP

| Clase | Responsabilidad |
|-------|-----------------|
| `Helado` | Producto con costo, venta y stock |
| `MovimientoInventario` | Entrada / salida / ajuste |
| `Dinero` | Value object monetario |
| `CalculadoraDiezmo` | 10% sobre ganancia |
| `InventarioService` | Orquesta CRUD y movimientos |
| `SupabaseInventarioRepository` | Persistencia en Supabase |
| `LocalStorageInventarioRepository` | Fallback local |
