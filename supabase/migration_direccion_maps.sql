-- Separar "dirección" (texto) y "link de Google Maps" en proveedores (tabla providers).
-- Hasta ahora el link de Maps se guardaba en providers.direccion.
-- Eventos ya tiene ambas columnas; solo se limpian URLs que hayan quedado en direccion.
-- Run this in Supabase SQL Editor.

-- 0) Vista previa (opcional): qué se va a mover
-- select id, nombre, direccion from public.providers
-- where direccion ~* '^\s*(https?://|www\.|maps\.app\.goo\.gl|goo\.gl/maps|g\.co/kgs)';

begin;

-- 1) Nueva columna
alter table public.providers
  add column if not exists google_maps_link text;

-- 2) Mover a google_maps_link lo que sea URL; lo demás queda como dirección en texto
update public.providers
set google_maps_link = trim(direccion),
    direccion = null
where google_maps_link is null
  and direccion ~* '^\s*(https?://|www\.|maps\.app\.goo\.gl|goo\.gl/maps|g\.co/kgs)';

-- 3) Misma limpieza en eventos
update public.events
set google_maps_link = trim(direccion),
    direccion = null
where google_maps_link is null
  and direccion ~* '^\s*(https?://|www\.|maps\.app\.goo\.gl|goo\.gl/maps|g\.co/kgs)';

commit;
