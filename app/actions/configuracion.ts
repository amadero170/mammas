"use server";

import { createClient } from "@/lib/supabase/server";

export type TagItem = {
  id: string;
  nombre: string;
  tipo: "provider" | "event";
  created_at: string;
};

export type CategoryItem = {
  id: string;
  nombre: string;
  tipo: "provider" | "event";
  icono: string | null;
  orden: number | null;
  created_at: string;
};

export type ZoneItem = {
  id: string;
  nombre: string;
  created_at: string;
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

/* ══════════════════════════════════════════════════════════
   TAGS ACTIONS
   ══════════════════════════════════════════════════════════ */
export async function getTags(tipo?: "provider" | "event"): Promise<{
  success: boolean;
  tags: TagItem[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Auto-sync any existing tags from providers & events into master catalog table
    try {
      const adminSupabase = createAdminClient();
      const { data: pData } = await adminSupabase.from("providers").select("tags");
      const { data: eData } = await adminSupabase.from("events").select("tags");

      const pTags = pData?.flatMap((p) => p.tags || []) || [];
      const eTags = eData?.flatMap((e) => e.tags || []) || [];

      if (pTags.length) await syncTagsToCatalog(pTags, "provider");
      if (eTags.length) await syncTagsToCatalog(eTags, "event");
    } catch (e) {
      console.error("Auto-sync tags error:", e);
    }

    let query = supabase.from("tags").select("*").order("nombre", { ascending: true });
    if (tipo) {
      query = query.eq("tipo", tipo);
    }
    const { data, error } = await query;
    if (error) return { success: false, tags: [], error: error.message };
    return { success: true, tags: (data ?? []) as TagItem[] };
  } catch (err: any) {
    return { success: false, tags: [], error: err.message || "Error al obtener tags" };
  }
}

export async function createTag(
  nombre: string,
  tipo: "provider" | "event"
): Promise<{ success: boolean; error?: string }> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const trimmed = nombre.trim();
  if (!trimmed) return { success: false, error: "El nombre es requerido" };

  const { error } = await supabase.from("tags").insert({
    nombre: trimmed,
    tipo,
  });

  if (error) {
    if (error.code === "23505") return { success: false, error: "El tag ya existe" };
    return { success: false, error: error.message };
  }

  return { success: true };
}

import { createAdminClient } from "@/lib/supabase/admin";

export async function syncTagsToCatalog(
  tags: string[] | null | undefined,
  tipo: "provider" | "event" = "provider"
) {
  if (!tags || !tags.length) return;
  try {
    const adminSupabase = createAdminClient();
    const cleanTags = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)));
    if (!cleanTags.length) return;

    const records = cleanTags.map((nombre) => ({ nombre, tipo }));
    await adminSupabase
      .from("tags")
      .upsert(records, { onConflict: "nombre,tipo", ignoreDuplicates: true });
  } catch (err) {
    console.error("Error syncing tags to catalog:", err);
  }
}

export async function deleteTag(id: string): Promise<{ success: boolean; error?: string }> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const adminSupabase = createAdminClient();

  // Fetch tag details before deleting
  const { data: tag } = await supabase.from("tags").select("nombre, tipo").eq("id", id).single();

  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  // Cascade cleanup from providers and events
  if (tag?.nombre) {
    const tagNombre = tag.nombre;

    // Cascade remove tag from providers
    const { data: providers } = await adminSupabase
      .from("providers")
      .select("id, tags")
      .contains("tags", [tagNombre]);

    if (providers?.length) {
      for (const p of providers) {
        const updatedTags = (p.tags || []).filter((t: string) => t !== tagNombre);
        await adminSupabase.from("providers").update({ tags: updatedTags }).eq("id", p.id);
      }
    }

    // Cascade remove tag from events
    const { data: events } = await adminSupabase
      .from("events")
      .select("id, tags")
      .contains("tags", [tagNombre]);

    if (events?.length) {
      for (const e of events) {
        const updatedTags = (e.tags || []).filter((t: string) => t !== tagNombre);
        await adminSupabase.from("events").update({ tags: updatedTags }).eq("id", e.id);
      }
    }
  }

  return { success: true };
}

/* ══════════════════════════════════════════════════════════
   CATEGORIES ACTIONS
   ══════════════════════════════════════════════════════════ */
export async function getCategories(tipo?: "provider" | "event"): Promise<{
  success: boolean;
  categories: CategoryItem[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    let query = supabase.from("categories").select("*").order("orden", { ascending: true }).order("nombre", { ascending: true });
    if (tipo) {
      query = query.eq("tipo", tipo);
    }
    const { data, error } = await query;
    if (error) return { success: false, categories: [], error: error.message };
    return { success: true, categories: (data ?? []) as CategoryItem[] };
  } catch (err: any) {
    return { success: false, categories: [], error: err.message || "Error al obtener categorías" };
  }
}

export async function createCategory(
  nombre: string,
  tipo: "provider" | "event" = "provider",
  icono?: string,
  orden: number = 0
): Promise<{ success: boolean; error?: string }> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const trimmed = nombre.trim();
  if (!trimmed) return { success: false, error: "El nombre es requerido" };

  const { error } = await supabase.from("categories").insert({
    nombre: trimmed,
    tipo,
    icono: icono?.trim() || null,
    orden,
  });

  if (error) {
    if (error.code === "23505") return { success: false, error: "La categoría ya existe" };
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const adminSupabase = createAdminClient();

  const { data: cat } = await supabase.from("categories").select("nombre, tipo").eq("id", id).single();

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  if (cat?.nombre) {
    const catNombre = cat.nombre;

    // Remove from providers categories array
    const { data: providers } = await adminSupabase
      .from("providers")
      .select("id, categorias")
      .contains("categorias", [catNombre]);

    if (providers?.length) {
      for (const p of providers) {
        const updated = (p.categorias || []).filter((c: string) => c !== catNombre);
        await adminSupabase.from("providers").update({ categorias: updated }).eq("id", p.id);
      }
    }

    // Reset from events category field if matched
    await adminSupabase
      .from("events")
      .update({ categoria: null })
      .eq("categoria", catNombre);
  }

  return { success: true };
}

/* ══════════════════════════════════════════════════════════
   ZONES ACTIONS
   ══════════════════════════════════════════════════════════ */
export async function getZones(): Promise<{
  success: boolean;
  zones: ZoneItem[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("zones").select("*").order("nombre", { ascending: true });
    if (error) return { success: false, zones: [], error: error.message };
    return { success: true, zones: (data ?? []) as ZoneItem[] };
  } catch (err: any) {
    return { success: false, zones: [], error: err.message || "Error al obtener zonas" };
  }
}

export async function createZone(nombre: string): Promise<{ success: boolean; error?: string }> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const trimmed = nombre.trim();
  if (!trimmed) return { success: false, error: "El nombre es requerido" };

  const { error } = await supabase.from("zones").insert({
    nombre: trimmed,
  });

  if (error) {
    if (error.code === "23505") return { success: false, error: "La zona ya existe" };
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteZone(id: string): Promise<{ success: boolean; error?: string }> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const adminSupabase = createAdminClient();

  const { data: zone } = await supabase.from("zones").select("nombre").eq("id", id).single();

  const { error } = await supabase.from("zones").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  if (zone?.nombre) {
    const zoneNombre = zone.nombre;
    await adminSupabase.from("providers").update({ zona: null }).eq("zona", zoneNombre);
    await adminSupabase.from("events").update({ zona: null }).eq("zona", zoneNombre);
  }

  return { success: true };
}
