"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Proveedor } from "@/lib/types";
import { normalizeTagsWithCatalog, syncTagsToCatalog } from "@/app/actions/configuracion";
import { MAX_CATEGORIAS } from "@/lib/constants/providers";
import { compareEs, looksLikeUrl, tagKey } from "@/lib/utils";
import {
  notifyAdminsNuevaCarga,
  notifyAportacionDesactivada,
  notifyAportacionRevisada,
} from "@/lib/aportaciones";

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
  google_maps_link?: string | null;
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

/** Campos editables comunes, ya limpios. */
async function buildPayload(input: ProviderUpsertInput) {
  return {
    nombre: input.nombre.trim(),
    descripcion: input.descripcion ?? null,
    categorias: input.categorias ?? [],
    zona: input.zona ?? null,
    telefono: input.telefono ?? null,
    tags: await normalizeTagsWithCatalog(input.tags, "provider"),
    mama_owned: input.mama_owned ?? false,
    sitio_web: input.sitio_web ?? null,
    facebook: input.facebook ?? null,
    instagram: input.instagram ?? null,
    direccion: input.direccion?.trim() || null,
    google_maps_link: input.google_maps_link?.trim() || null,
    logo_url: input.logo_url ?? null,
    logo_public_id: input.logo_public_id ?? null,
  };
}

function validate(input: ProviderUpsertInput): string | null {
  if (!input.nombre?.trim()) return "El nombre es requerido";
  if ((input.categorias?.length ?? 0) > MAX_CATEGORIAS) {
    return `Puedes elegir hasta ${MAX_CATEGORIAS} categorías`;
  }
  if (input.direccion && looksLikeUrl(input.direccion)) {
    return "En dirección va el texto de la dirección; el enlace de Google Maps va en su propio campo";
  }
  return null;
}

export async function listProvidersAdmin(): Promise<
  | { success: true; providers: Proveedor[] }
  | { success: false; error: string }
> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const { data, error } = await supabase.from("providers").select("*");

  if (error) return { success: false, error: error.message };
  const providers = ((data ?? []) as Proveedor[]).sort((a, b) => compareEs(a.nombre, b.nombre));
  return { success: true, providers };
}

export async function upsertProvider(
  input: ProviderUpsertInput
): Promise<{ success: true } | { success: false; error: string }> {
  const { ok, supabase, user } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const invalid = validate(input);
  if (invalid) return { success: false, error: invalid };

  const payload = await buildPayload(input);

  // IMPORTANT (RLS): avoid UPSERT for edits, because it executes as an INSERT with ON CONFLICT DO UPDATE,
  // and can hit INSERT policies (e.g. with_check on creado_por).
  if (!input.id) {
    // Lo que carga una admin queda aprobado y visible directamente
    const { error } = await supabase.from("providers").insert({
      ...payload,
      creado_por: user!.id,
      aprobacion: "aprobado",
      is_active: true,
      revisado_por: user!.id,
      revisado_at: new Date().toISOString(),
    });
    if (error) return { success: false, error: error.message };
    await syncTagsToCatalog(payload.tags, "provider");
    return { success: true };
  }

  const { error } = await supabase
    .from("providers")
    .update(payload)
    .eq("id", input.id);

  if (error) return { success: false, error: error.message };
  await syncTagsToCatalog(payload.tags, "provider");
  return { success: true };
}

/** Aprobar o rechazar un proveedor pendiente. Al aprobar queda activo. */
export async function reviewProvider(
  id: string,
  decision: "aprobado" | "rechazado",
  motivo?: string
): Promise<{ success: true; emailSent: boolean } | { success: false; error: string }> {
  const { ok, supabase, user } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const { data: provider } = await supabase
    .from("providers")
    .select("id, nombre, creado_por")
    .eq("id", id)
    .single();
  if (!provider) return { success: false, error: "Proveedor no encontrado" };

  const aprobado = decision === "aprobado";
  const motivoLimpio = motivo?.trim() || null;

  const { error } = await supabase
    .from("providers")
    .update({
      aprobacion: decision,
      is_active: aprobado,
      estado: aprobado ? "active" : "inactive",
      motivo_rechazo: aprobado ? null : motivoLimpio,
      revisado_por: user!.id,
      revisado_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  const emailSent = await notifyAportacionRevisada({
    creadoPor: provider.creado_por,
    revisadoPor: user!.id,
    tipo: "proveedor",
    titulo: provider.nombre,
    aprobado,
    motivo: motivoLimpio,
  });

  return { success: true, emailSent };
}

/** Activar o desactivar un proveedor ya aprobado. */
export async function toggleProviderActive(
  id: string,
  active: boolean,
  motivo?: string
): Promise<{ success: true; emailSent?: boolean } | { success: false; error: string }> {
  const { ok, supabase, user } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const { data: provider } = await supabase
    .from("providers")
    .select("aprobacion, nombre, creado_por")
    .eq("id", id)
    .single();
  if (!provider) return { success: false, error: "Proveedor no encontrado" };
  if (provider.aprobacion !== "aprobado") {
    return { success: false, error: "Primero hay que aprobar el proveedor" };
  }

  const { error } = await supabase
    .from("providers")
    .update({ is_active: active, estado: active ? "active" : "inactive" })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  // Al desactivar se avisa a quien lo cargó; al reactivar, no
  if (!active) {
    const emailSent = await notifyAportacionDesactivada({
      creadoPor: provider.creado_por,
      revisadoPor: user!.id,
      tipo: "proveedor",
      titulo: provider.nombre,
      motivo: motivo?.trim() || null,
    });
    return { success: true, emailSent };
  }
  return { success: true };
}

export type ProviderCreateInput = Omit<ProviderUpsertInput, "id">;

export async function createProviderAsMamma(
  input: ProviderCreateInput
): Promise<{ success: true } | { success: false; error: string }> {
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

  const invalid = validate(input);
  if (invalid) return { success: false, error: invalid };

  const payload = await buildPayload(input);
  const isAdmin = profile.role === "admin";

  // Lo de una mamá queda pendiente de revisión; lo de una admin, aprobado
  const { error } = await supabase.from("providers").insert({
    ...payload,
    creado_por: user.id,
    aprobacion: isAdmin ? "aprobado" : "pendiente",
    is_active: isAdmin,
    ...(isAdmin ? { revisado_por: user.id, revisado_at: new Date().toISOString() } : {}),
  });
  if (error) return { success: false, error: error.message };
  await syncTagsToCatalog(payload.tags, "provider");
  if (!isAdmin) {
    await notifyAdminsNuevaCarga({ tipo: "proveedor", titulo: payload.nombre, autorId: user.id });
  }
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

  const { data: existing } = await supabase
    .from("providers")
    .select("id, creado_por, aprobacion")
    .eq("id", id)
    .single();

  if (!existing) return { success: false, error: "Proveedor no encontrado" };
  if (existing.creado_por !== user.id) return { success: false, error: "No autorizado" };
  if (existing.aprobacion === "aprobado") {
    return { success: false, error: "Solo puedes editar proveedores pendientes o rechazados" };
  }

  const invalid = validate(input);
  if (invalid) return { success: false, error: invalid };

  const payload = await buildPayload(input);

  // Si estaba rechazado, al corregirlo vuelve a la fila de revisión
  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("providers")
    .update({ ...payload, aprobacion: "pendiente", motivo_rechazo: null })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  await syncTagsToCatalog(payload.tags, "provider");
  if (existing.aprobacion === "rechazado") {
    await notifyAdminsNuevaCarga({ tipo: "proveedor", titulo: payload.nombre, autorId: user.id, reenvio: true });
  }
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

  let query = supabase
    .from("providers")
    .select("*")
    .eq("is_active", true)
    .eq("aprobacion", "aprobado");

  if (filters.categoria) query = query.overlaps("categorias", [filters.categoria]);
  if (filters.zona) query = query.eq("zona", filters.zona);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  let results = (data ?? []) as Proveedor[];

  // Búsqueda de texto sin importar mayúsculas ni acentos, en campos de texto, tags y categorías
  const q = filters.q?.trim();
  if (q) {
    const qKey = tagKey(q);
    results = results.filter((p) =>
      [
        p.nombre,
        p.descripcion,
        p.zona,
        p.direccion,
        p.telefono,
        p.sitio_web,
        p.instagram,
        p.facebook,
        ...(p.tags ?? []),
        ...(p.categorias ?? []),
      ].some((field) => field && tagKey(field).includes(qKey))
    );
  }

  // Tags (OR): el proveedor debe tener al menos UNO de los tags elegidos.
  // Se compara sin mayúsculas/acentos/espacios para no perder proveedores por diferencias de escritura.
  if (filters.tags && filters.tags.length > 0) {
    const selected = new Set(filters.tags.map(tagKey));
    results = results.filter((p) => p.tags?.some((t) => selected.has(tagKey(t))));
  }

  results.sort((a, b) => compareEs(a.nombre, b.nombre));
  return { success: true, providers: results };
}
