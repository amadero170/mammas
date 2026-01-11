"use server";

import { createClient } from "@/lib/supabase/server";
import type { Proveedor } from "@/lib/types";

export type ProviderUpsertInput = {
  id?: string;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  zona?: string | null;
  telefono?: string | null;
  tags?: string[] | null;
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
      categoria: input.categoria ?? null,
      zona: input.zona ?? null,
      telefono: input.telefono ?? null,
      tags: input.tags ?? [],
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
    categoria: input.categoria ?? null,
    zona: input.zona ?? null,
    telefono: input.telefono ?? null,
    tags: input.tags ?? [],
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
  isActive: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  const { ok, supabase } = await assertAdmin();
  if (!ok) return { success: false, error: "No autorizado" };

  const { error } = await supabase
    .from("providers")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export type ProviderCreateInput = {
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  zona?: string | null;
  telefono?: string | null;
  tags?: string[] | null;
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

  if (profile?.role !== "mamma") {
    return { success: false, error: "No autorizado" };
  }

  if (!input.nombre?.trim()) {
    return { success: false, error: "El nombre es requerido" };
  }

  const payload = {
    nombre: input.nombre.trim(),
    descripcion: input.descripcion ?? null,
    categoria: input.categoria ?? null,
    zona: input.zona ?? null,
    telefono: input.telefono ?? null,
    tags: input.tags ?? [],
    creado_por: user.id,
    is_active: false, // queda inactivo hasta que admin lo active
  };

  const { error } = await supabase.from("providers").insert(payload);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export type ProvidersPublicFilters = {
  q?: string;
  categoria?: string;
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

  if (profile?.role !== "mamma") {
    return { success: false, error: "No autorizado" };
  }

  let query = supabase.from("providers").select("*").eq("creado_por", user.id);

  if (filters.categoria) query = query.eq("categoria", filters.categoria);
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

  if (filters.categoria) query = query.eq("categoria", filters.categoria);
  if (filters.zona) query = query.eq("zona", filters.zona);

  const q = filters.q?.trim();
  if (q) {
    // MVP: search in nombre/descripcion
    query = query.or(`nombre.ilike.%${q}%,descripcion.ilike.%${q}%`);
  }

  // Tags filter (AND): provider must include ALL selected tags
  if (filters.tags && filters.tags.length > 0) {
    query = query.contains("tags", filters.tags);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) return { success: false, error: error.message };
  return { success: true, providers: (data ?? []) as Proveedor[] };
}

