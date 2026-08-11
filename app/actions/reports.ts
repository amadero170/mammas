"use server";

import { createClient } from "@/lib/supabase/server";

export type ReportItem = {
  id: string;
  target_type: "provider" | "event";
  target_id: string;
  user_id: string;
  motivo: string;
  detalles: string | null;
  estado: "pending" | "resolved" | "dismissed";
  revisado_por: string | null;
  revisado_at: string | null;
  created_at: string;
  // Joined fields
  target_nombre?: string;
  user_nombre?: string;
  user_email?: string;
};

export async function createReport(input: {
  target_type: "provider" | "event";
  target_id: string;
  motivo: string;
  detalles?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para enviar un reporte" };
    }

    if (!input.motivo) {
      return { success: false, error: "Por favor selecciona un motivo para el reporte" };
    }

    const { error } = await supabase.from("reports").insert({
      target_type: input.target_type,
      target_id: input.target_id,
      user_id: user.id,
      motivo: input.motivo,
      detalles: input.detalles?.trim() || null,
      estado: "pending",
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al enviar el reporte" };
  }
}

export async function getReports(estado?: string): Promise<{
  success: boolean;
  reports: ReportItem[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, reports: [], error: "No autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { success: false, reports: [], error: "No autorizado" };
    }

    let query = supabase.from("reports").select("*").order("created_at", { ascending: false });
    if (estado) {
      query = query.eq("estado", estado);
    }

    const { data, error } = await query;
    if (error) return { success: false, reports: [], error: error.message };

    const reports = (data ?? []) as ReportItem[];

    // Fetch user profiles & target names
    const userIds = Array.from(new Set(reports.map((r) => r.user_id)));
    const providerIds = Array.from(
      new Set(reports.filter((r) => r.target_type === "provider").map((r) => r.target_id))
    );
    const eventIds = Array.from(
      new Set(reports.filter((r) => r.target_type === "event").map((r) => r.target_id))
    );

    const { data: profiles } = userIds.length
      ? await supabase.from("profiles").select("id, nombre, email").in("id", userIds)
      : { data: [] };
    const profilesMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const { data: providers } = providerIds.length
      ? await supabase.from("providers").select("id, nombre").in("id", providerIds)
      : { data: [] };
    const providersMap = new Map((providers ?? []).map((p) => [p.id, p.nombre]));

    const { data: events } = eventIds.length
      ? await supabase.from("events").select("id, titulo").in("id", eventIds)
      : { data: [] };
    const eventsMap = new Map((events ?? []).map((e) => [e.id, e.titulo]));

    const enriched = reports.map((r) => {
      const p = profilesMap.get(r.user_id);
      const targetName =
        r.target_type === "provider"
          ? providersMap.get(r.target_id) || "Proveedor eliminado"
          : eventsMap.get(r.target_id) || "Evento eliminado";

      return {
        ...r,
        user_nombre: p?.nombre || p?.email || "Usuario",
        user_email: p?.email || "",
        target_nombre: targetName,
      };
    });

    return { success: true, reports: enriched };
  } catch (err: any) {
    return { success: false, reports: [], error: err.message || "Error al obtener reportes" };
  }
}

export async function resolveReport(
  reportId: string,
  action: "dismiss" | "deactivate_target"
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

    const { data: report, error: fetchErr } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (fetchErr || !report) return { success: false, error: "Reporte no encontrado" };

    if (action === "deactivate_target") {
      if (report.target_type === "provider") {
        await supabase
          .from("providers")
          .update({ is_active: false, estado: "inactive", updated_at: new Date().toISOString() })
          .eq("id", report.target_id);
      } else {
        await supabase
          .from("events")
          .update({ estado: "draft", updated_at: new Date().toISOString() })
          .eq("id", report.target_id);
      }
    }

    const nextState = action === "deactivate_target" ? "resolved" : "dismissed";

    const { error: updateErr } = await supabase
      .from("reports")
      .update({
        estado: nextState,
        revisado_por: user.id,
        revisado_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (updateErr) return { success: false, error: updateErr.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al resolver reporte" };
  }
}
