"use server";

import { createClient } from "@/lib/supabase/server";
import type { Evento } from "@/lib/types";

export type EventUpsertInput = {
  id?: string;
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  ubicacion: string;
  direccion?: string | null;
  google_maps_link?: string | null;
  categoria: string;
  imagen_url?: string | null;
  imagen_public_id?: string | null;
  link_externo?: string | null;
  horario_inicio?: string | null;
  horario_fin?: string | null;
  telefono?: string | null;
  precios?: string | null;
  zona?: string | null;
};

export type EventsPublicFilters = {
  q?: string;
  categoria?: string;
  zona?: string;
};

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, supabase, user: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { ok: false as const, supabase, user };
  }

  return { ok: true as const, supabase, user };
}

export async function listEventsAdmin(): Promise<
  | { success: true; events: Evento[] }
  | { success: false; error: string }
> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("fecha_inicio", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, events: (data ?? []) as Evento[] };
}

export async function upsertEvent(
  input: EventUpsertInput
): Promise<{ success: true } | { success: false; error: string }> {
  const { ok, supabase, user } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  if (!input.titulo?.trim()) {
    return { success: false, error: "El título es requerido" };
  }
  if (!input.descripcion?.trim()) {
    return { success: false, error: "La descripción es requerida" };
  }
  if (!input.fecha_inicio) {
    return { success: false, error: "La fecha de inicio es requerida" };
  }
  if (!input.ubicacion?.trim()) {
    return { success: false, error: "La ubicación es requerida" };
  }
  if (!input.categoria?.trim()) {
    return { success: false, error: "La categoría es requerida" };
  }

  const isCreate = !input.id;

  if (isCreate) {
    const payload = {
      titulo: input.titulo.trim(),
      descripcion: input.descripcion.trim(),
      fecha_inicio: input.fecha_inicio,
      fecha_fin: input.fecha_fin || null,
      ubicacion: input.ubicacion.trim(),
      direccion: input.direccion || null,
      google_maps_link: input.google_maps_link || null,
      categoria: input.categoria.trim(),
      imagen_url: input.imagen_url || null,
      imagen_public_id: input.imagen_public_id || null,
      link_externo: input.link_externo || null,
      horario_inicio: input.horario_inicio || null,
      horario_fin: input.horario_fin || null,
      telefono: input.telefono || null,
      precios: input.precios || null,
      zona: input.zona || null,
      estado: "draft" as const,
      creado_por: user!.id,
    };

    const { error } = await supabase.from("events").insert(payload);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // Update — no cambiamos estado ni creado_por
  const payload = {
    titulo: input.titulo.trim(),
    descripcion: input.descripcion.trim(),
    fecha_inicio: input.fecha_inicio,
    fecha_fin: input.fecha_fin || null,
    ubicacion: input.ubicacion.trim(),
    direccion: input.direccion || null,
    google_maps_link: input.google_maps_link || null,
    categoria: input.categoria.trim(),
    imagen_url: input.imagen_url || null,
    imagen_public_id: input.imagen_public_id || null,
    link_externo: input.link_externo || null,
    horario_inicio: input.horario_inicio || null,
    horario_fin: input.horario_fin || null,
    telefono: input.telefono || null,
    precios: input.precios || null,
    zona: input.zona || null,
  };

  const { error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", input.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function toggleEventEstado(
  id: string,
  estado: "draft" | "published"
): Promise<{ success: true } | { success: false; error: string }> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const { error } = await supabase
    .from("events")
    .update({ estado })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listEventsPublic(
  filters: EventsPublicFilters
): Promise<
  | { success: true; events: Evento[] }
  | { success: false; error: string }
> {
  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select("*");

  if (filters.categoria) query = query.eq("categoria", filters.categoria);
  if (filters.zona) query = query.eq("zona", filters.zona);

  const q = filters.q?.trim();
  if (q) {
    query = query.or(`titulo.ilike.%${q}%,descripcion.ilike.%${q}%`);
  }

  const { data, error } = await query.order("fecha_inicio", { ascending: true });
  if (error) return { success: false, error: error.message };
  return { success: true, events: (data ?? []) as Evento[] };
}
