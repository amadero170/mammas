"use server";

import { createClient } from "@/lib/supabase/server";

export type SuggestionItem = {
  id: string;
  target_type: "provider" | "event";
  target_id: string;
  user_id: string;
  datos_sugeridos: Record<string, any>;
  comentario: string | null;
  estado: "pending" | "accepted" | "rejected";
  revisado_por: string | null;
  revisado_at: string | null;
  created_at: string;
  // Joined fields
  target_nombre?: string;
  user_nombre?: string;
  user_email?: string;
  target_data?: Record<string, any>;
};

export async function createSuggestion(input: {
  target_type: "provider" | "event";
  target_id: string;
  datos_sugeridos: Record<string, any>;
  comentario?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para sugerir un cambio" };
    }

    const { error } = await supabase.from("suggestions").insert({
      target_type: input.target_type,
      target_id: input.target_id,
      user_id: user.id,
      datos_sugeridos: input.datos_sugeridos,
      comentario: input.comentario?.trim() || null,
      estado: "pending",
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al enviar la sugerencia" };
  }
}

export async function getSuggestions(estado?: string): Promise<{
  success: boolean;
  suggestions: SuggestionItem[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, suggestions: [], error: "No autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { success: false, suggestions: [], error: "No autorizado" };
    }

    let query = supabase.from("suggestions").select("*").order("created_at", { ascending: false });
    if (estado) {
      query = query.eq("estado", estado);
    }

    const { data, error } = await query;
    if (error) return { success: false, suggestions: [], error: error.message };

    const suggestions = (data ?? []) as SuggestionItem[];

    // Fetch user profiles & target records
    const userIds = Array.from(new Set(suggestions.map((s) => s.user_id)));
    const providerIds = Array.from(
      new Set(suggestions.filter((s) => s.target_type === "provider").map((s) => s.target_id))
    );
    const eventIds = Array.from(
      new Set(suggestions.filter((s) => s.target_type === "event").map((s) => s.target_id))
    );

    // Get profiles
    const { data: profiles } = userIds.length
      ? await supabase.from("profiles").select("id, nombre, email").in("id", userIds)
      : { data: [] };
    const profilesMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    // Get providers full records
    const { data: providers } = providerIds.length
      ? await supabase.from("providers").select("*").in("id", providerIds)
      : { data: [] };
    const providersMap = new Map((providers ?? []).map((p) => [p.id, p]));

    // Get events full records
    const { data: events } = eventIds.length
      ? await supabase.from("events").select("*").in("id", eventIds)
      : { data: [] };
    const eventsMap = new Map((events ?? []).map((e) => [e.id, e]));

    const enriched = suggestions.map((s) => {
      const p = profilesMap.get(s.user_id);
      const targetObj =
        s.target_type === "provider"
          ? providersMap.get(s.target_id)
          : eventsMap.get(s.target_id);

      const targetName =
        s.target_type === "provider"
          ? targetObj?.nombre || "Proveedor eliminado"
          : targetObj?.titulo || "Evento eliminado";

      return {
        ...s,
        user_nombre: p?.nombre || p?.email || "Usuario",
        user_email: p?.email || "",
        target_nombre: targetName,
        target_data: targetObj || {},
      };
    });

    return { success: true, suggestions: enriched };
  } catch (err: any) {
    return { success: false, suggestions: [], error: err.message || "Error al obtener sugerencias" };
  }
}

export async function acceptSuggestion(
  suggestionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
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

    if (profile?.role !== "admin") {
      return { success: false, error: "No autorizado" };
    }

    // Fetch suggestion
    const { data: suggestion, error: fetchErr } = await supabase
      .from("suggestions")
      .select("*")
      .eq("id", suggestionId)
      .single();

    if (fetchErr || !suggestion) return { success: false, error: "Sugerencia no encontrada" };

    const datos = suggestion.datos_sugeridos;

    // Apply suggested changes to target table
    if (suggestion.target_type === "provider") {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (datos.nombre !== undefined) payload.nombre = datos.nombre;
      if (datos.descripcion !== undefined) payload.descripcion = datos.descripcion;
      if (datos.categorias !== undefined) payload.categorias = datos.categorias;
      if (datos.zona !== undefined) payload.zona = datos.zona;
      if (datos.telefono !== undefined) payload.telefono = datos.telefono;
      if (datos.tags !== undefined) payload.tags = datos.tags;
      if (datos.mama_owned !== undefined) payload.mama_owned = datos.mama_owned;
      if (datos.sitio_web !== undefined) payload.sitio_web = datos.sitio_web;
      if (datos.facebook !== undefined) payload.facebook = datos.facebook;
      if (datos.instagram !== undefined) payload.instagram = datos.instagram;
      if (datos.direccion !== undefined) payload.direccion = datos.direccion;

      const { error: updateErr } = await supabase
        .from("providers")
        .update(payload)
        .eq("id", suggestion.target_id);

      if (updateErr) return { success: false, error: updateErr.message };
    } else if (suggestion.target_type === "event") {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (datos.titulo !== undefined) payload.titulo = datos.titulo;
      if (datos.descripcion !== undefined) payload.descripcion = datos.descripcion;
      if (datos.fecha_inicio !== undefined) payload.fecha_inicio = datos.fecha_inicio;
      if (datos.fecha_fin !== undefined) payload.fecha_fin = datos.fecha_fin;
      if (datos.ubicacion !== undefined) payload.ubicacion = datos.ubicacion;
      if (datos.direccion !== undefined) payload.direccion = datos.direccion;
      if (datos.horario_inicio !== undefined) payload.horario_inicio = datos.horario_inicio;
      if (datos.horario_fin !== undefined) payload.horario_fin = datos.horario_fin;
      if (datos.telefono !== undefined) payload.telefono = datos.telefono;
      if (datos.precios !== undefined) payload.precios = datos.precios;
      if (datos.zona !== undefined) payload.zona = datos.zona;
      if (datos.tags !== undefined) payload.tags = datos.tags;
      if (datos.link_externo !== undefined) payload.link_externo = datos.link_externo;

      const { error: updateErr } = await supabase
        .from("events")
        .update(payload)
        .eq("id", suggestion.target_id);

      if (updateErr) return { success: false, error: updateErr.message };
    }

    // Mark suggestion as accepted
    const { error: suggUpdateErr } = await supabase
      .from("suggestions")
      .update({
        estado: "accepted",
        revisado_por: user.id,
        revisado_at: new Date().toISOString(),
      })
      .eq("id", suggestionId);

    if (suggUpdateErr) return { success: false, error: suggUpdateErr.message };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al aceptar la sugerencia" };
  }
}

export async function rejectSuggestion(
  suggestionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
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

    if (profile?.role !== "admin") {
      return { success: false, error: "No autorizado" };
    }

    const { error } = await supabase
      .from("suggestions")
      .update({
        estado: "rejected",
        revisado_por: user.id,
        revisado_at: new Date().toISOString(),
      })
      .eq("id", suggestionId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al rechazar la sugerencia" };
  }
}
