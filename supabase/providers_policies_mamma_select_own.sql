-- Allow a mamma (authenticated) to read ONLY her own providers, even if inactive.
-- Run this in Supabase SQL Editor.

alter table public.providers enable row level security;

drop policy if exists "providers_select_own" on public.providers;
create policy "providers_select_own"
on public.providers
for select
to authenticated
using (creado_por = auth.uid());

