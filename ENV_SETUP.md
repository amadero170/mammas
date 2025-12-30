# Configuración de Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudinary Configuration (opcional, para más adelante)
# NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

## Cómo obtener las credenciales de Supabase:

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Navega a Settings > API
3. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Nota de Seguridad

⚠️ **Nunca** commitees el archivo `.env.local` al repositorio. Ya está incluido en `.gitignore`.
