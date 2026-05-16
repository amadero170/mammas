-- Events (Sección de Eventos)
-- Run this in Supabase SQL Editor.

-- 1) RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public: solo pueden ver eventos publicados
DROP POLICY IF EXISTS "events_select_published" ON public.events;
CREATE POLICY "events_select_published"
ON public.events
FOR SELECT
TO anon, authenticated
USING (estado = 'published');

-- Admin: puede ver todos los eventos (draft + published)
DROP POLICY IF EXISTS "events_admin_select_all" ON public.events;
CREATE POLICY "events_admin_select_all"
ON public.events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Admin: puede crear eventos
DROP POLICY IF EXISTS "events_admin_insert" ON public.events;
CREATE POLICY "events_admin_insert"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Admin: puede editar eventos
DROP POLICY IF EXISTS "events_admin_update" ON public.events;
CREATE POLICY "events_admin_update"
ON public.events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 2) updated_at trigger (reutiliza la función existente set_updated_at)
DROP TRIGGER IF EXISTS events_set_updated_at ON public.events;
CREATE TRIGGER events_set_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 3) Índices
CREATE INDEX IF NOT EXISTS events_estado_idx ON public.events (estado);
CREATE INDEX IF NOT EXISTS events_fecha_inicio_idx ON public.events (fecha_inicio);
CREATE INDEX IF NOT EXISTS events_categoria_idx ON public.events (categoria);
CREATE INDEX IF NOT EXISTS events_zona_idx ON public.events (zona);
