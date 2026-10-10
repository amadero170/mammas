-- ═══════════════════════════════════════════════════════════════════
-- Migración: flujo de aprobación (pendiente / aprobado / rechazado)
--            separado de activo/inactivo, y limpieza de tags.
--
-- Correr UNA vez en el SQL Editor de Supabase ANTES de desplegar el código.
-- Es segura de re-ejecutar: el backfill solo corre cuando la columna se crea.
-- ═══════════════════════════════════════════════════════════════════

begin;

-- ─────────────────────────────────────────────
-- 1) PROVEEDORES
-- ─────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'providers' and column_name = 'aprobacion'
  ) then
    alter table public.providers add column aprobacion text not null default 'pendiente';

    -- Activos -> aprobados. Inactivos y archivados -> pendientes (las admins los revisan una vez).
    update public.providers
    set aprobacion = case when is_active then 'aprobado' else 'pendiente' end;
  end if;
end $$;

alter table public.providers drop constraint if exists providers_aprobacion_check;
alter table public.providers add constraint providers_aprobacion_check
  check (aprobacion in ('pendiente', 'aprobado', 'rechazado'));

alter table public.providers add column if not exists motivo_rechazo text;
alter table public.providers add column if not exists revisado_at timestamptz;
alter table public.providers add column if not exists revisado_por uuid
  references public.profiles(id) on delete set null;

-- "archivado" deja de usarse
update public.providers set estado = 'inactive' where estado = 'archivado';

-- Un proveedor no aprobado nunca puede estar visible
update public.providers set is_active = false where aprobacion <> 'aprobado' and is_active;

create index if not exists providers_aprobacion_idx on public.providers (aprobacion);

-- ─────────────────────────────────────────────
-- 2) EVENTOS  (estado: 'publicado' = activo, 'draft' = inactivo)
-- ─────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'events' and column_name = 'aprobacion'
  ) then
    alter table public.events add column aprobacion text not null default 'pendiente';

    update public.events
    set aprobacion = case when estado = 'publicado' then 'aprobado' else 'pendiente' end;
  end if;
end $$;

alter table public.events drop constraint if exists events_aprobacion_check;
alter table public.events add constraint events_aprobacion_check
  check (aprobacion in ('pendiente', 'aprobado', 'rechazado'));

alter table public.events add column if not exists motivo_rechazo text;
alter table public.events add column if not exists revisado_at timestamptz;
alter table public.events add column if not exists revisado_por uuid
  references public.profiles(id) on delete set null;

-- "archivado" deja de usarse
update public.events set estado = 'draft' where estado = 'archivado';

-- Un evento no aprobado nunca puede estar publicado
update public.events set estado = 'draft' where aprobacion <> 'aprobado' and estado = 'publicado';

create index if not exists events_aprobacion_idx on public.events (aprobacion);

-- ─────────────────────────────────────────────
-- 3) LIMPIEZA DE TAGS
--    a) Catálogo: quitar espacios sobrantes y eliminar variantes por mayúsculas
--       (se conserva la que empieza con mayúscula).
--    b) Proveedores/eventos: usar la escritura del catálogo y quitar duplicados.
-- ─────────────────────────────────────────────
update public.tags t
set nombre = regexp_replace(trim(t.nombre), '\s+', ' ', 'g')
where t.nombre <> regexp_replace(trim(t.nombre), '\s+', ' ', 'g')
  and not exists (
    select 1 from public.tags o
    where o.tipo = t.tipo and o.id <> t.id
      and o.nombre = regexp_replace(trim(t.nombre), '\s+', ' ', 'g')
  );

delete from public.tags t
using public.tags k
where t.tipo = k.tipo
  and t.id <> k.id
  and lower(regexp_replace(trim(t.nombre), '\s+', ' ', 'g')) = lower(regexp_replace(trim(k.nombre), '\s+', ' ', 'g'))
  and (k.nombre collate "C") < (t.nombre collate "C");

update public.providers p
set tags = coalesce((
  select array_agg(distinct coalesce(c.nombre, x.tag))
  from (
    select regexp_replace(trim(raw), '\s+', ' ', 'g') as tag
    from unnest(p.tags) as raw
  ) x
  left join lateral (
    select nombre from public.tags
    where tipo = 'provider' and lower(nombre) = lower(x.tag)
    order by nombre collate "C"
    limit 1
  ) c on true
  where x.tag <> ''
), '{}')
where p.tags is not null and cardinality(p.tags) > 0;

update public.events e
set tags = coalesce((
  select array_agg(distinct coalesce(c.nombre, x.tag))
  from (
    select regexp_replace(trim(raw), '\s+', ' ', 'g') as tag
    from unnest(e.tags) as raw
  ) x
  left join lateral (
    select nombre from public.tags
    where tipo = 'event' and lower(nombre) = lower(x.tag)
    order by nombre collate "C"
    limit 1
  ) c on true
  where x.tag <> ''
), '{}')
where e.tags is not null and cardinality(e.tags) > 0;

commit;

-- Verificación rápida (opcional)
-- select aprobacion, is_active, count(*) from public.providers group by 1, 2 order by 1, 2;
-- select aprobacion, estado, count(*) from public.events group by 1, 2 order by 1, 2;
