-- Allow a mamma (authenticated) to read ONLY her own providers, even if inactive.
-- Run this in Supabase SQL Editor.

alter table public.providers enable row level security;

drop policy if exists "providers_select_own" on public.providers;
create policy "providers_select_own"
on public.providers
for select
to authenticated
using (creado_por = auth.uid());

-- Explicit Data API Grants (Supabase Security Best Practices)
GRANT SELECT ON public.providers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
