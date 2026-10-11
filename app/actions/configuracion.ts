"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { compareEs, formatTag, normalizeTags, tagKey } from "@/lib/utils";

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
    const tags = ((data ?? []) as TagItem[]).sort((a, b) => compareEs(a.nombre, b.nombre));
    return { success: true, tags };
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

  const trimmed = formatTag(nombre);
  if (!trimmed) return { success: false, error: "El nombre es requerido" };

  const { data: existing } = await supabase.from("tags").select("nombre").eq("tipo", tipo);
  if ((existing ?? []).some((t) => tagKey(t.nombre) === tagKey(trimmed))) {
    return { success: false, error: "El tag ya existe" };
  }

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

export async function syncTagsToCatalog(
  tags: string[] | null | undefined,
  tipo: "provider" | "event" = "provider"
) {
  if (!tags || !tags.length) return;
  try {
    const adminSupabase = createAdminClient();
    const { data: existing } = await adminSupabase.from("tags").select("nombre").eq("tipo", tipo);
    const existingKeys = new Set((existing ?? []).map((t) => tagKey(t.nombre)));

    // Solo agregamos tags que no existan ya con otra escritura (mayúsculas, acentos, espacios)
    const records = normalizeTags(tags)
      .filter((nombre) => !existingKeys.has(tagKey(nombre)))
      .map((nombre) => ({ nombre, tipo }));
    if (!records.length) return;

    await adminSupabase
      .from("tags")
      .upsert(records, { onConflict: "nombre,tipo", ignoreDuplicates: true });
  } catch (err) {
    console.error("Error syncing tags to catalog:", err);
  }
}

/** Devuelve los tags limpios y con la escritura del catálogo. */
export async function normalizeTagsWithCatalog(
  tags: string[] | null | undefined,
  tipo: "provider" | "event"
): Promise<string[]> {
  if (!tags || !tags.length) return [];
  try {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase.from("tags").select("nombre").eq("tipo", tipo);
    return normalizeTags(tags, (data ?? []).map((t) => t.nombre));
  } catch {
    return normalizeTags(tags);
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

/**
 * Renombra un tag y lo actualiza en todos los proveedores/eventos que lo usan.
 * Si el nombre nuevo ya existe como otro tag, los fusiona en ese.
 */
export async function renameTag(
  id: string,
  nuevoNombre: string
): Promise<{ success: boolean; error?: string; merged?: boolean }> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const nombre = formatTag(nuevoNombre);
  if (!nombre) return { success: false, error: "El nombre es requerido" };

  const { data: tag } = await supabase.from("tags").select("nombre, tipo").eq("id", id).single();
  if (!tag) return { success: false, error: "Tag no encontrado" };
  if (tag.nombre === nombre) return { success: true };

  const adminSupabase = createAdminClient();
  const { data: catalog } = await adminSupabase.from("tags").select("id, nombre").eq("tipo", tag.tipo);
  const target = (catalog ?? []).find((t) => t.id !== id && tagKey(t.nombre) === tagKey(nombre));

  // Fusionar: el tag viejo desaparece y se usa el existente. Renombrar: se cambia el nombre.
  const finalNombre = target ? target.nombre : nombre;
  const { error } = target
    ? await adminSupabase.from("tags").delete().eq("id", id)
    : await adminSupabase.from("tags").update({ nombre: finalNombre }).eq("id", id);
  if (error) return { success: false, error: error.message };

  // Reemplazar en proveedores o eventos (se compara sin mayúsculas/acentos por si hay variantes)
  const table = tag.tipo === "provider" ? "providers" : "events";
  const oldKey = tagKey(tag.nombre);
  const { data: rows } = await adminSupabase.from(table).select("id, tags").not("tags", "is", null);

  for (const row of rows ?? []) {
    const tags: string[] = row.tags ?? [];
    if (!tags.some((t) => tagKey(t) === oldKey)) continue;
    const updated = normalizeTags(tags.map((t) => (tagKey(t) === oldKey ? finalNombre : t)));
    await adminSupabase.from(table).update({ tags: updated }).eq("id", row.id);
  }

  return { success: true, merged: !!target };
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
    let query = supabase.from("categories").select("*");
    if (tipo) {
      query = query.eq("tipo", tipo);
    }
    const { data, error } = await query;
    if (error) return { success: false, categories: [], error: error.message };
    const categories = ((data ?? []) as CategoryItem[]).sort((a, b) => compareEs(a.nombre, b.nombre));
    return { success: true, categories };
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

export async function renameCategory(
  id: string,
  nuevoNombre: string
): Promise<{ success: boolean; error?: string }> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const trimmed = nuevoNombre.trim();
  if (!trimmed) return { success: false, error: "El nombre es requerido" };

  const { data: cat } = await supabase.from("categories").select("nombre, tipo").eq("id", id).single();
  if (!cat) return { success: false, error: "Categoría no encontrada" };
  if (cat.nombre === trimmed) return { success: true };

  const { error } = await supabase.from("categories").update({ nombre: trimmed }).eq("id", id);
  if (error) {
    if (error.code === "23505") return { success: false, error: "Ya existe una categoría con ese nombre" };
    return { success: false, error: error.message };
  }

  // Los proveedores y eventos guardan el nombre como texto: actualizar en cascada
  const adminSupabase = createAdminClient();
  if (cat.tipo === "provider") {
    const { data: providers } = await adminSupabase
      .from("providers")
      .select("id, categorias")
      .contains("categorias", [cat.nombre]);

    for (const p of providers ?? []) {
      const updated = Array.from(
        new Set((p.categorias || []).map((c: string) => (c === cat.nombre ? trimmed : c)))
      );
      await adminSupabase.from("providers").update({ categorias: updated }).eq("id", p.id);
    }
  } else {
    await adminSupabase.from("events").update({ categoria: trimmed }).eq("categoria", cat.nombre);
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
    const { data, error } = await supabase.from("zones").select("*");
    if (error) return { success: false, zones: [], error: error.message };
    const zones = ((data ?? []) as ZoneItem[]).sort((a, b) => compareEs(a.nombre, b.nombre));
    return { success: true, zones };
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

export async function renameZone(
  id: string,
  nuevoNombre: string
): Promise<{ success: boolean; error?: string }> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const trimmed = nuevoNombre.trim();
  if (!trimmed) return { success: false, error: "El nombre es requerido" };

  const { data: zone } = await supabase.from("zones").select("nombre").eq("id", id).single();
  if (!zone) return { success: false, error: "Zona no encontrada" };
  if (zone.nombre === trimmed) return { success: true };

  const { error } = await supabase.from("zones").update({ nombre: trimmed }).eq("id", id);
  if (error) {
    if (error.code === "23505") return { success: false, error: "Ya existe una zona con ese nombre" };
    return { success: false, error: error.message };
  }

  // Los proveedores y eventos guardan el nombre como texto: actualizar en cascada
  const adminSupabase = createAdminClient();
  await adminSupabase.from("providers").update({ zona: trimmed }).eq("zona", zone.nombre);
  await adminSupabase.from("events").update({ zona: trimmed }).eq("zona", zone.nombre);

  return { success: true };
}
