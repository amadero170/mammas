"use server";

import { createClient, createAnonymousClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";
import type {
  SolicitudMamma,
  EstadoSolicitud,
  CreateSolicitudData,
} from "@/lib/types";

export async function createSolicitud(data: CreateSolicitudData) {
  try {
    const supabase = await createAnonymousClient();

    const { error } = await supabase.from("mammas_autorizadas").insert({
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono || null,
      mensaje: data.mensaje || null,
      estado: "pending",
    });

    if (error) {
      console.error("Error creating solicitud:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "Error inesperado al crear la solicitud" };
  }
}
export async function getSolicitudes(estado?: EstadoSolicitud) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("mammas_autorizadas")
      .select("*")
      .order("created_at", { ascending: false });

    if (estado) {
      query = query.eq("estado", estado);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching solicitudes:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: (data || []) as SolicitudMamma[] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "Error inesperado al obtener solicitudes",
      data: [],
    };
  }
}

export async function aprobarSolicitud(id: string, adminId: string) {
  try {
    const supabase = await createClient();

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const nowIso = new Date().toISOString();
    const inviteExpiresAtIso = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error } = await supabase
      .from("mammas_autorizadas")
      .update({
        estado: "approved",
        revisado_por: adminId,
        revisado_at: nowIso,
        invite_token_hash: tokenHash,
        invite_created_at: nowIso,
        invite_expires_at: inviteExpiresAtIso,
        invite_used_at: null,
      })
      .eq("id", id);

    if (error) {
      console.error("Error approving solicitud:", error);
      return { success: false, error: error.message };
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";
    const inviteUrl = `${baseUrl}/registro?token=${token}`;

    return { success: true, inviteUrl };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "Error inesperado al aprobar la solicitud",
    };
  }
}

export async function rechazarSolicitud(
  id: string,
  adminId: string,
  razon: string
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("mammas_autorizadas")
      .update({
        estado: "rejected",
        revisado_por: adminId,
        razon_rechazo: razon,
        revisado_at: new Date().toISOString(),
        invite_token_hash: null,
        invite_created_at: null,
        invite_expires_at: null,
        invite_used_at: null,
      })
      .eq("id", id);

    if (error) {
      console.error("Error rejecting solicitud:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "Error inesperado al rechazar la solicitud",
    };
  }
}
