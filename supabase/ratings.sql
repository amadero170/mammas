-- ====================================================================
-- Calificaciones de Proveedores
-- Tabla que relaciona mamás/admins con proveedores.
-- Cada una puede dar un puntaje (1-5) a cada proveedor, o ninguno.
-- Run this in Supabase SQL Editor.
-- ====================================================================

-- 1) Si ya existe de un intento anterior, borrarla
drop table if exists public.ratings;

-- 2) Table
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score smallint not null check (score >= 1 and score <= 5),
  created_at timestamptz not null default now(),

  -- Una calificación por persona por proveedor
  unique(provider_id, user_id)
);

-- 3) Índices
create index ratings_provider_id_idx on public.ratings (provider_id);
create index ratings_user_id_idx on public.ratings (user_id);

-- 4) RLS
alter table public.ratings enable row level security;

-- Todos pueden leer (para calcular promedio en los cards)
create policy "ratings_select_all"
on public.ratings for select
to anon, authenticated
using (true);

-- Mamás y admins pueden insertar su propia calificación
create policy "ratings_insert_authorized"
on public.ratings for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.role = 'mamma' or p.role = 'admin')
  )
);

-- Solo el dueño puede actualizar su calificación
create policy "ratings_update_own"
on public.ratings for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Solo el dueño puede borrar su calificación
create policy "ratings_delete_own"
on public.ratings for delete
to authenticated
using (user_id = auth.uid());

-- 5) Grants para Data API
GRANT SELECT ON public.ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;
