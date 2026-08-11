"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  categoria?: string | null;
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
    return { ok: false as const, supabase, adminSupabase: supabase, user: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { ok: false as const, supabase, adminSupabase: supabase, user };
  }

  // Use service role client for data operations (bypasses RLS)
  const adminSupabase = createAdminClient();
  return { ok: true as const, supabase, adminSupabase, user };
}

async function assertAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, supabase, adminSupabase: supabase, user: null };
  }

  const adminSupabase = createAdminClient();
  return { ok: true as const, supabase, adminSupabase, user };
}

export async function listEventsAdmin(): Promise<
  | { success: true; events: Evento[] }
  | { success: false; error: string }
> {
  const { ok, adminSupabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const { data, error } = await adminSupabase
    .from("events")
    .select("*")
    .order("fecha_inicio", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, events: (data ?? []) as Evento[] };
}

export async function upsertEvent(
  input: EventUpsertInput
): Promise<{ success: true } | { success: false; error: string }> {
  const { ok, adminSupabase, user } = await assertAdmin();
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
      categoria: input.categoria?.trim() || null,
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

    const { error } = await adminSupabase.from("events").insert(payload);
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
    categoria: input.categoria?.trim() || null,
    imagen_url: input.imagen_url || null,
    imagen_public_id: input.imagen_public_id || null,
    link_externo: input.link_externo || null,
    horario_inicio: input.horario_inicio || null,
    horario_fin: input.horario_fin || null,
    telefono: input.telefono || null,
    precios: input.precios || null,
    zona: input.zona || null,
  };

  const { error } = await adminSupabase
    .from("events")
    .update(payload)
    .eq("id", input.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function toggleEventEstado(
  id: string,
  estado: "draft" | "publicado" | "archivado"
): Promise<{ success: true } | { success: false; error: string }> {
  const { ok, adminSupabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const { error } = await adminSupabase
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
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  let query = supabase
    .from("events")
    .select("*")
    .eq("estado", "publicado");

  if (filters.categoria) query = query.eq("categoria", filters.categoria);
  if (filters.zona) query = query.eq("zona", filters.zona);

  const q = filters.q?.trim();
  if (q) {
    // Search across all text fields
    query = query.or(
      `titulo.ilike.%${q}%,descripcion.ilike.%${q}%,ubicacion.ilike.%${q}%,direccion.ilike.%${q}%,zona.ilike.%${q}%,telefono.ilike.%${q}%,precios.ilike.%${q}%,link_externo.ilike.%${q}%`
    );
  }

  const { data, error } = await query.order("fecha_inicio", { ascending: true });
  if (error) return { success: false, error: error.message };

  // Filter out past events:
  // - If fecha_fin exists and is in the past → hide
  // - If no fecha_fin and fecha_inicio is in the past → hide
  let filtered = (data ?? []).filter((evt) => {
    if (evt.fecha_fin) return evt.fecha_fin >= today;
    return evt.fecha_inicio >= today;
  }) as Evento[];

  // If text search is active, also include events matching via tags array
  if (q) {
    const qLower = q.toLowerCase();
    const { data: allData } = await supabase
      .from("events")
      .select("*")
      .eq("estado", "publicado")
      .order("fecha_inicio", { ascending: true });

    if (allData) {
      const existingIds = new Set(filtered.map((e) => e.id));
      const arrayMatches = (allData as Evento[]).filter(
        (e) =>
          !existingIds.has(e.id) &&
          e.tags?.some((t: string) => t.toLowerCase().includes(qLower))
      ).filter((evt) => {
        // Apply same past-event filter
        if (evt.fecha_fin) return evt.fecha_fin >= today;
        return evt.fecha_inicio >= today;
      }).filter((evt) => {
        // Apply same category/zona filters
        if (filters.categoria && evt.categoria !== filters.categoria) return false;
        if (filters.zona && evt.zona !== filters.zona) return false;
        return true;
      });
      filtered = [...filtered, ...arrayMatches];
    }
  }

  return { success: true, events: filtered };
}

/* ═══════════════════════════════════════════════════════════
   Mama-facing actions (no admin required, just authenticated)
   ═══════════════════════════════════════════════════════════ */

export async function createEventAsMamma(
  input: Omit<EventUpsertInput, "id">
): Promise<{ success: true } | { success: false; error: string }> {
  const { ok, adminSupabase, user } = await assertAuth();
  if (!ok || !user) return { success: false, error: "Debes iniciar sesión" };

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


  const payload = {
    titulo: input.titulo.trim(),
    descripcion: input.descripcion.trim(),
    fecha_inicio: input.fecha_inicio,
    fecha_fin: input.fecha_fin || null,
    ubicacion: input.ubicacion.trim(),
    direccion: input.direccion || null,
    google_maps_link: input.google_maps_link || null,
    imagen_url: input.imagen_url || null,
    imagen_public_id: input.imagen_public_id || null,
    link_externo: input.link_externo || null,
    horario_inicio: input.horario_inicio || null,
    horario_fin: input.horario_fin || null,
    telefono: input.telefono || null,
    precios: input.precios || null,
    zona: input.zona || null,
    estado: "draft" as const,
    creado_por: user.id,
  };

  const { error } = await adminSupabase.from("events").insert(payload);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateMyEvent(
  id: string,
  input: Omit<EventUpsertInput, "id">
): Promise<{ success: true } | { success: false; error: string }> {
  const { ok, adminSupabase, user } = await assertAuth();
  if (!ok || !user) return { success: false, error: "Debes iniciar sesión" };

  // Verify ownership and draft status (estado !== 'publicado')
  const { data: existing, error: getErr } = await adminSupabase
    .from("events")
    .select("id, creado_por, estado")
    .eq("id", id)
    .single();

  if (getErr || !existing) return { success: false, error: "Evento no encontrado" };
  if (existing.creado_por !== user.id) return { success: false, error: "No autorizado" };
  if (existing.estado === "publicado") return { success: false, error: "Solo puedes editar eventos en estado borrador" };

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

  const payload = {
    titulo: input.titulo.trim(),
    descripcion: input.descripcion.trim(),
    fecha_inicio: input.fecha_inicio,
    fecha_fin: input.fecha_fin || null,
    ubicacion: input.ubicacion.trim(),
    direccion: input.direccion || null,
    google_maps_link: input.google_maps_link || null,
    imagen_url: input.imagen_url || null,
    imagen_public_id: input.imagen_public_id || null,
    link_externo: input.link_externo || null,
    horario_inicio: input.horario_inicio || null,
    horario_fin: input.horario_fin || null,
    telefono: input.telefono || null,
    precios: input.precios || null,
    zona: input.zona || null,
  };

  const { error } = await adminSupabase
    .from("events")
    .update(payload)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listMyEvents(filters?: {
  q?: string;
  categoria?: string;
}): Promise<
  | { success: true; events: Evento[] }
  | { success: false; error: string }
> {
  const { ok, adminSupabase, user } = await assertAuth();
  if (!ok || !user) return { success: false, error: "Debes iniciar sesión" };

  let query = adminSupabase
    .from("events")
    .select("*")
    .eq("creado_por", user.id);

  if (filters?.categoria) query = query.eq("categoria", filters.categoria);

  const q = filters?.q?.trim();
  if (q) {
    query = query.or(`titulo.ilike.%${q}%,descripcion.ilike.%${q}%`);
  }

  const { data, error } = await query.order("fecha_inicio", { ascending: false });
  if (error) return { success: false, error: error.message };
  return { success: true, events: (data ?? []) as Evento[] };
}

export async function deleteMyEvent(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const { ok, adminSupabase, user } = await assertAuth();
  if (!ok || !user) return { success: false, error: "Debes iniciar sesión" };

  // Only allow deleting own events
  const { error } = await adminSupabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("creado_por", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

