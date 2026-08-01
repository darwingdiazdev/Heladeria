# Paso a paso: configurar Supabase

## 1. Crear cuenta y proyecto

1. Entra a https://supabase.com y regístrate (GitHub o email).
2. Click en **New project**.
3. Elige organización (o crea una).
4. Completa:
   - **Name:** `inventario-helados` (o el que quieras)
   - **Database password:** guárdala en un lugar seguro
   - **Region:** la más cercana (ej. South America si aparece)
5. Click **Create new project** y espera 1–2 minutos.

## 2. Crear las tablas

1. En el menú izquierdo: **SQL Editor**.
2. Click **New query**.
3. Abre el archivo del repo: `supabase/schema.sql`.
4. Copia TODO el contenido y pégalo en el editor.
5. Click **Run** (o Ctrl+Enter).
6. Debe decir *Success*. Verifica en **Table Editor** que existan:
   - `helados`
   - `movimientos`

## 3. Copiar URL y API key

1. Menú: **Project Settings** (engranaje) → **API**.
2. Copia:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public** key → un JWT largo que empieza por `eyJ...`

## 4. Configurar la app en tu PC

En la carpeta del proyecto:

```bash
cd Desktop/inventario-helados
cp apps/web/.env.example apps/web/.env.local
```

Edita `apps/web/.env.local` y deja así (con TUS valores):

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...tu_clave_anon
```

Luego:

```bash
pnpm install
pnpm dev
```

Abre http://localhost:5173

Debajo del título debe verse la etiqueta **Supabase** (no "Local").

Prueba: agrega un helado → en Supabase → **Table Editor** → `helados` debe aparecer la fila.

## 5. (Opcional) Subir a Render para el teléfono

1. Sube el repo a GitHub.
2. En https://render.com → **New** → **Static Site**.
3. Conecta el repo.
4. Configura:
   - **Build Command:**

```bash
pnpm install && pnpm --filter @inventario/domain build && pnpm --filter @inventario/web build
```

   - **Publish Directory:** `apps/web/dist`
5. En **Environment** agrega las mismas variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy. Abre la URL de Render en el teléfono: verás los mismos datos que en la PC.

## Notas

- La clave `anon` es pública en el frontend; las policies del SQL permiten leer/escribir (app personal).
- No subas `.env.local` a GitHub (ya está en `.gitignore`).
- Si no configuras las variables, la app usa `localStorage` y verás la etiqueta **Local**.
