# Mammas Bahía - Directorio de Proveedores

Plataforma de directorio de proveedores construida con Next.js 15, TypeScript, Tailwind CSS y Supabase.

## Stack Tecnológico

- **Next.js 15** (App Router)
- **TypeScript** (modo estricto)
- **Tailwind CSS**
- **shadcn/ui** (componentes base)
- **Supabase** (@supabase/supabase-js, @supabase/ssr)
- **Cloudinary** (para imágenes - configuración pendiente)

## Estructura del Proyecto

```
/app
  /layout.tsx          # Layout principal
  /page.tsx            # Home pública
  /(auth)              # Rutas de autenticación
    /login
    /solicitar-acceso
  /(dashboard)         # Rutas autenticadas
    /layout.tsx        # Layout del dashboard
    /mi-cuenta
  /(public)            # Rutas públicas
    /directorio
    /eventos
    /nosotras
/components
  /ui                 # Componentes shadcn/ui
  /providers          # Providers de React
  /auth               # Componentes de autenticación
/lib
  /supabase           # Cliente Supabase (client.ts, server.ts)
  /types              # Tipos TypeScript
  /utils.ts           # Utilidades (cn para shadcn)
/public               # Archivos estáticos
```

## Configuración Inicial

1. **Instalar dependencias:**

   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**

   - Copia `.env.local.example` a `.env.local`
   - Agrega tus credenciales de Supabase:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

## Componentes shadcn/ui Instalados

- `button`
- `card`
- `input`
- `label`
- `form` (incluye react-hook-form + zod)

## Próximos Pasos

- Implementar autenticación con Supabase
- Configurar Cloudinary para imágenes
- Desarrollar páginas completas
- Implementar funcionalidades del directorio
