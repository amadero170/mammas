-- Pares de tags que una admin marcó como "no son lo mismo", para no volver a sugerir fusionarlos.
-- Solo se accede desde el servidor (service role), por eso RLS queda activo sin políticas.
-- Run this in Supabase SQL Editor.

create table if not exists public.tag_sugerencias_descartadas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('provider', 'event')),
  -- tagKey de ambos tags, ordenados y unidos con "|": "bodas|botas"
  par text not null,
  descartado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tipo, par)
);

alter table public.tag_sugerencias_descartadas enable row level security;
