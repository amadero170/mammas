"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Proveedor } from "@/lib/types";

export type ProviderUpsertInput = {
  id?: string;
  nombre: string;
  descripcion?: string | null;
  categorias?: string[] | null;
  zona?: string | null;
  telefono?: string | null;
  tags?: string[] | null;
  mama_owned?: boolean;
  sitio_web?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  direccion?: string | null;
  logo_url?: string | null;
  logo_public_id?: string | null;
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

export async function listProvidersAdmin(): Promise<
  | { success: true; providers: Proveedor[] }
  | { success: false; error: string }
> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, providers: (data ?? []) as Proveedor[] };
}

export async function upsertProvider(
  input: ProviderUpsertInput
): Promise<{ success: true } | { success: false; error: string }> {
  const { ok, supabase, user } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  if (!input.nombre?.trim()) {
    return { success: false, error: "El nombre es requerido" };
  }

  const isCreate = !input.id;

  // IMPORTANT (RLS): avoid UPSERT for edits, because it executes as an INSERT with ON CONFLICT DO UPDATE,
  // and can hit INSERT policies (e.g. with_check on creado_por).
  if (isCreate) {
    const payload = {
      nombre: input.nombre.trim(),
      descripcion: input.descripcion ?? null,
      categorias: input.categorias ?? [],
      zona: input.zona ?? null,
      telefono: input.telefono ?? null,
      tags: input.tags ?? [],
      mama_owned: input.mama_owned ?? false,
      sitio_web: input.sitio_web ?? null,
      facebook: input.facebook ?? null,
      instagram: input.instagram ?? null,
      direccion: input.direccion ?? null,
      logo_url: input.logo_url ?? null,
      logo_public_id: input.logo_public_id ?? null,
      creado_por: user!.id,
      is_active: false, // new providers start inactive for MVP
    };

    const { error } = await supabase.from("providers").insert(payload);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  const payload = {
    nombre: input.nombre.trim(),
    descripcion: input.descripcion ?? null,
    categorias: input.categorias ?? [],
    zona: input.zona ?? null,
    telefono: input.telefono ?? null,
    tags: input.tags ?? [],
    mama_owned: input.mama_owned ?? false,
    sitio_web: input.sitio_web ?? null,
    facebook: input.facebook ?? null,
    instagram: input.instagram ?? null,
    direccion: input.direccion ?? null,
    logo_url: input.logo_url ?? null,
    logo_public_id: input.logo_public_id ?? null,
  };

  const { error } = await supabase
    .from("providers")
    .update(payload)
    .eq("id", input.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function toggleProviderActive(
  id: string,
  nextState: boolean | "active" | "inactive" | "archivado"
): Promise<{ success: true } | { success: false; error: string }> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  let is_active = false;
  let estado = "inactive";

  if (nextState === true || nextState === "active") {
    is_active = true;
    estado = "active";
  } else if (nextState === "archivado") {
    is_active = false;
    estado = "archivado";
  } else {
    is_active = false;
    estado = "inactive";
  }

  const { error } = await supabase
    .from("providers")
    .update({ is_active, estado })
    .eq("id", id);

  if (error) {
    // Fallback if DB check constraint does not yet allow 'archivado'
    if (nextState === "archivado") {
      const { error: fallbackErr } = await supabase
        .from("providers")
        .update({ is_active: false })
        .eq("id", id);
      if (!fallbackErr) return { success: true };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}

export type ProviderCreateInput = {
  nombre: string;
  descripcion?: string | null;
  categorias?: string[] | null;
  zona?: string | null;
  telefono?: string | null;
  tags?: string[] | null;
  mama_owned?: boolean;
  sitio_web?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  direccion?: string | null;
  logo_url?: string | null;
  logo_public_id?: string | null;
};

export async function createProviderAsMamma(
  input: ProviderCreateInput
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  // En MVP, limitamos esta ruta a mammas (no admin) como pidió el flujo.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "mamma" && profile?.role !== "admin") {
    return { success: false, error: "No autorizado" };
  }

  if (!input.nombre?.trim()) {
    return { success: false, error: "El nombre es requerido" };
  }

  const payload = {
    nombre: input.nombre.trim(),
    descripcion: input.descripcion ?? null,
    categorias: input.categorias ?? [],
    zona: input.zona ?? null,
    telefono: input.telefono ?? null,
    tags: input.tags ?? [],
    mama_owned: input.mama_owned ?? false,
    sitio_web: input.sitio_web ?? null,
    facebook: input.facebook ?? null,
    instagram: input.instagram ?? null,
    direccion: input.direccion ?? null,
    logo_url: input.logo_url ?? null,
    logo_public_id: input.logo_public_id ?? null,
    creado_por: user.id,
    is_active: false, // queda inactivo hasta que admin lo active
  };

  const { error } = await supabase.from("providers").insert(payload);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateMyProvider(
  id: string,
  input: ProviderCreateInput
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  // Verify ownership and draft status (is_active = false)
  const { data: existing } = await supabase
    .from("providers")
    .select("id, creado_por, is_active")
    .eq("id", id)
    .single();

  if (!existing) return { success: false, error: "Proveedor no encontrado" };
  if (existing.creado_por !== user.id) return { success: false, error: "No autorizado" };
  if (existing.is_active) return { success: false, error: "Solo podés editar proveedores que aún no fueron aprobados" };

  if (!input.nombre?.trim()) {
    return { success: false, error: "El nombre es requerido" };
  }

  const payload = {
    nombre: input.nombre.trim(),
    descripcion: input.descripcion ?? null,
    categorias: input.categorias ?? [],
    zona: input.zona ?? null,
    telefono: input.telefono ?? null,
    tags: input.tags ?? [],
    mama_owned: input.mama_owned ?? false,
    sitio_web: input.sitio_web ?? null,
    facebook: input.facebook ?? null,
    instagram: input.instagram ?? null,
    direccion: input.direccion ?? null,
    logo_url: input.logo_url ?? null,
    logo_public_id: input.logo_public_id ?? null,
  };

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("providers")
    .update(payload)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
export type ProvidersPublicFilters = {
  q?: string;
  categoria?: string; // single category from filter dropdown — matched via overlaps
  zona?: string;
  tags?: string[];
};

export type MyProvidersFilters = ProvidersPublicFilters;

export async function listMyProviders(
  filters: MyProvidersFilters
): Promise<
  | { success: true; providers: Proveedor[] }
  | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "mamma" && profile?.role !== "admin") {
    return { success: false, error: "No autorizado" };
  }

  let query = supabase.from("providers").select("*").eq("creado_por", user.id);

  if (filters.categoria) query = query.overlaps("categorias", [filters.categoria]);
  if (filters.zona) query = query.eq("zona", filters.zona);

  const q = filters.q?.trim();
  if (q) {
    query = query.or(`nombre.ilike.%${q}%,descripcion.ilike.%${q}%`);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) return { success: false, error: error.message };
  return { success: true, providers: (data ?? []) as Proveedor[] };
}

export async function listProvidersPublic(
  filters: ProvidersPublicFilters
): Promise<
  | { success: true; providers: Proveedor[] }
  | { success: false; error: string }
> {
  const supabase = await createClient();

  let query = supabase.from("providers").select("*").eq("is_active", true);

  if (filters.categoria) query = query.overlaps("categorias", [filters.categoria]);
  if (filters.zona) query = query.eq("zona", filters.zona);

  const q = filters.q?.trim();
  if (q) {
    // Search across all text fields
    query = query.or(
      `nombre.ilike.%${q}%,descripcion.ilike.%${q}%,zona.ilike.%${q}%,direccion.ilike.%${q}%,telefono.ilike.%${q}%,sitio_web.ilike.%${q}%,instagram.ilike.%${q}%,facebook.ilike.%${q}%`
    );
  }

  // Tags filter (OR): provider must include at least ONE selected tag
  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) return { success: false, error: error.message };

  let results = (data ?? []) as Proveedor[];

  // If text search is active, also include providers matching via tags/categorias arrays.
  // The Supabase `or()` filter above only covers text columns; array fields need post-filtering.
  if (q) {
    const qLower = q.toLowerCase();
    const { data: allData } = await supabase
      .from("providers")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (allData) {
      const existingIds = new Set(results.map((p) => p.id));
      const arrayMatches = (allData as Proveedor[]).filter(
        (p) =>
          !existingIds.has(p.id) &&
          (p.tags?.some((t: string) => t.toLowerCase().includes(qLower)) ||
            p.categorias?.some((c: string) => c.toLowerCase().includes(qLower)))
      );
      // Apply same category/zona/tags filters to array matches
      const filtered = arrayMatches.filter((p) => {
        if (filters.categoria && !p.categorias?.includes(filters.categoria)) return false;
        if (filters.zona && p.zona !== filters.zona) return false;
        if (filters.tags?.length && !filters.tags.some((t) => p.tags?.includes(t))) return false;
        return true;
      });
      results = [...results, ...filtered];
    }
  }

  return { success: true, providers: results };
}
