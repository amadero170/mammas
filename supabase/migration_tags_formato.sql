-- Formato de tags: solo la primera letra en mayúscula ("CLASES PARTICULARES" -> "Clases particulares").
-- El código ya guarda así los tags nuevos; esto corrige los existentes en el catálogo,
-- proveedores y eventos. Segura de re-ejecutar.
-- Run this in Supabase SQL Editor.

-- 0) Vista previa (opcional): cómo quedarían los tags del catálogo
-- select nombre,
--        upper(left(regexp_replace(trim(nombre), '\s+', ' ', 'g'), 1))
--          || lower(substr(regexp_replace(trim(nombre), '\s+', ' ', 'g'), 2)) as nuevo
-- from public.tags order by tipo, nombre;

begin;

create or replace function pg_temp.fmt_tag(t text) returns text
language sql immutable as $$
  select upper(left(regexp_replace(trim(t), '\s+', ' ', 'g'), 1))
      || lower(substr(regexp_replace(trim(t), '\s+', ' ', 'g'), 2))
$$;

-- 1) Catálogo: quitar variantes que solo difieren en mayúsculas (quedarían repetidas)
delete from public.tags t
using public.tags k
where t.tipo = k.tipo
  and t.id <> k.id
  and lower(pg_temp.fmt_tag(t.nombre)) = lower(pg_temp.fmt_tag(k.nombre))
  and (k.nombre collate "C") < (t.nombre collate "C");

-- 2) Catálogo: aplicar formato
update public.tags
set nombre = pg_temp.fmt_tag(nombre)
where nombre <> pg_temp.fmt_tag(nombre);

-- 3) Proveedores y eventos: aplicar formato y quitar duplicados (solo filas que cambian)
update public.providers p
set tags = x.nuevos
from (
  select id, coalesce((
    select array_agg(distinct pg_temp.fmt_tag(raw))
    from unnest(tags) as raw
    where trim(raw) <> ''
  ), '{}') as nuevos
  from public.providers
  where tags is not null and cardinality(tags) > 0
) x
where p.id = x.id and p.tags is distinct from x.nuevos;

update public.events e
set tags = x.nuevos
from (
  select id, coalesce((
    select array_agg(distinct pg_temp.fmt_tag(raw))
    from unnest(tags) as raw
    where trim(raw) <> ''
  ), '{}') as nuevos
  from public.events
  where tags is not null and cardinality(tags) > 0
) x
where e.id = x.id and e.tags is distinct from x.nuevos;

commit;
