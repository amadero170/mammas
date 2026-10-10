"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserDetailsMap } from "@/lib/user-utils";

export type MyProfile = {
  nombre: string;
  telefono: string;
};

/** Nombre y teléfono de la cuenta actual (los mismos que ven las admins). */
export async function getMyProfile(): Promise<
  { success: true; profile: MyProfile } | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const details = (await getUserDetailsMap([user.id]))[user.id];
  return {
    success: true,
    profile: {
      nombre: details?.nombre ?? "",
      telefono: details?.telefono ?? "",
    },
  };
}

export async function updateMyProfile(input: MyProfile): Promise<
  { success: true } | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const nombre = input.nombre.replace(/\s+/g, " ").trim();
  const telefono = input.telefono.trim();
  if (nombre.length < 2) return { success: false, error: "El nombre debe tener al menos 2 caracteres" };

  // El nombre y el teléfono se leen primero de los metadatos de Auth (ver getUserDetailsMap)
  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, nombre, telefono: telefono || null },
  });
  if (error) return { success: false, error: error.message };

  // Mantener profiles.nombre en sincronía
  const { error: profileErr } = await adminSupabase.from("profiles").update({ nombre }).eq("id", user.id);
  if (profileErr) console.warn("[PERFIL] Could not update profiles.nombre:", profileErr.message);

  return { success: true };
}
