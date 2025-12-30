"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  SolicitudMamma,
  EstadoSolicitud,
  CreateSolicitudData,
} from "@/lib/types";

export async function createSolicitud(data: CreateSolicitudData) {
  try {
    const supabase = await createClient();

    const { data: solicitud, error } = await supabase
      .from("mammas_autorizadas")
      .insert({
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono || null,
        mensaje: data.mensaje || null,
        estado: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating solicitud:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: solicitud };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "Error inesperado al crear la solicitud",
    };
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

    const { data, error } = await supabase
      .from("mammas_autorizadas")
      .update({
        estado: "approved",
        admin_id: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error approving solicitud:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
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

    const { data, error } = await supabase
      .from("mammas_autorizadas")
      .update({
        estado: "rejected",
        admin_id: adminId,
        razon_rechazo: razon,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error rejecting solicitud:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "Error inesperado al rechazar la solicitud",
    };
  }
}
