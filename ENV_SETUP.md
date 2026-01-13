# Configuración de Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Resend Configuration (para envío de emails)
RESEND_API_KEY=re_xxxxxxxxx
# En producción, cambia por tu dominio verificado: "Mammas Bahía <noreply@tu-dominio.com>"
RESEND_FROM_EMAIL=Mammas Bahía <onboarding@resend.dev>

# Site URL (para generar links de invitación)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cloudinary Configuration (opcional, para más adelante)
# NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

## Cómo obtener las credenciales de Supabase:

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Navega a Settings > API
3. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ mantén esta clave segura)

## Cómo obtener las credenciales de Resend:

1. Ve a [Resend](https://resend.com) y accede a tu cuenta
2. Navega a **API Keys** en el sidebar
3. Crea una nueva API Key y cópiala → `RESEND_API_KEY`
4. (Producción) Ve a **Domains** y verifica tu dominio para usar un email personalizado

## Nota de Seguridad

⚠️ **Nunca** commitees el archivo `.env.local` al repositorio. Ya está incluido en `.gitignore`.
