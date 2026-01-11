-- Proveedores (MVP)
-- Run this in Supabase SQL Editor.

-- 1) Table
create table if not exists public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  categoria text,
  tags text[] not null default '{}'::text[],
  zona text,
  telefono text,
  whatsapp text,
  instagram text,
  web text,
  imagen_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proveedores_is_active_idx on public.proveedores (is_active);
create index if not exists proveedores_categoria_idx on public.proveedores (categoria);
create index if not exists proveedores_zona_idx on public.proveedores (zona);

-- 2) updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists proveedores_set_updated_at on public.proveedores;
create trigger proveedores_set_updated_at
before update on public.proveedores
for each row
execute function public.set_updated_at();

-- 3) RLS
alter table public.proveedores enable row level security;

-- Public (anon/authenticated): can read only active providers
drop policy if exists "proveedores_select_active" on public.proveedores;
create policy "proveedores_select_active"
on public.proveedores
for select
to anon, authenticated
using (is_active = true);

-- Admin-only write policies (based on profiles.role = 'admin')
drop policy if exists "proveedores_admin_insert" on public.proveedores;
create policy "proveedores_admin_insert"
on public.proveedores
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "proveedores_admin_update" on public.proveedores;
create policy "proveedores_admin_update"
on public.proveedores
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Optional: admin can also read inactive rows (so /admin/proveedores can show all)
drop policy if exists "proveedores_admin_select_all" on public.proveedores;
create policy "proveedores_admin_select_all"
on public.proveedores
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- 4) Dummy data (idempotent-ish by nombre)
insert into public.proveedores (nombre, descripcion, categoria, tags, zona, telefono, whatsapp, instagram, web, imagen_url, is_active)
values
  ('Lactancia Bahía', 'Asesoría de lactancia a domicilio y online.', 'Salud', array['lactancia','puerperio'], 'Bahía Blanca', '291-000-0001', '2910000001', '@lactanciabahia', 'https://example.com', null, true),
  ('Kine Mamá', 'Kinesiología y recuperación post parto.', 'Salud', array['kinesiologia','postparto'], 'Bahía Blanca', '291-000-0002', '2910000002', '@kinemama', null, null, true),
  ('Pediatría Cerca', 'Consultas pediátricas, controles y orientación.', 'Salud', array['pediatria'], 'Bahía Blanca', '291-000-0003', '2910000003', '@pediatriacerca', null, null, true),
  ('PsicoMaternidad', 'Acompañamiento psicológico perinatal.', 'Salud', array['psicologia','perinatal'], 'Punta Alta', '291-000-0004', '2910000004', '@psicomaternidad', null, null, true),

  ('Taller de Sueño', 'Rutinas, sueño infantil y acompañamiento.', 'Crianza', array['sueño','rutinas'], 'Bahía Blanca', '291-000-0010', '2910000010', '@tallerdessueno', null, null, true),
  ('Crianza con Amor', 'Charlas y talleres de crianza respetuosa.', 'Crianza', array['crianza','taller'], 'Bahía Blanca', '291-000-0011', '2910000011', '@crianzaconamor', null, null, true),
  ('Estimulación Temprana', 'Actividades para bebés y peques.', 'Crianza', array['estimulación','juego'], 'Ingeniero White', '291-000-0012', '2910000012', '@estimtemprana', null, null, true),

  ('Ropa Mini', 'Ropa para bebés y niños, talles varios.', 'Compras', array['ropa','bebes'], 'Bahía Blanca', '291-000-0020', '2910000020', '@ropamini', null, null, true),
  ('Pañales y Más', 'Pañales, higiene y productos para mamás.', 'Compras', array['pañales','higiene'], 'Bahía Blanca', '291-000-0021', '2910000021', '@panalesymas', null, null, true),
  ('Juguetes Montessori', 'Juguetes didácticos y sensoriales.', 'Compras', array['juguetes','montessori'], 'Punta Alta', '291-000-0022', '2910000022', '@juguetesmontessori', null, null, true),

  ('Fotitos de Familia', 'Sesiones newborn y familia.', 'Servicios', array['fotos','newborn'], 'Bahía Blanca', '291-000-0030', '2910000030', '@fotitosdefamilia', null, null, true),
  ('Doulas Bahía', 'Acompañamiento en embarazo y parto.', 'Servicios', array['doula','parto'], 'Bahía Blanca', '291-000-0031', '2910000031', '@doulasbahia', null, null, true),
  ('Catering Kids', 'Cumples, mesas dulces y opciones saludables.', 'Servicios', array['cumple','catering'], 'Bahía Blanca', '291-000-0032', '2910000032', '@cateringkids', null, null, true),
  ('Espacio Juego', 'Playroom y eventos para peques.', 'Servicios', array['eventos','juego'], 'Bahía Blanca', '291-000-0033', '2910000033', '@espaciojuego', null, null, true)
on conflict do nothing;

