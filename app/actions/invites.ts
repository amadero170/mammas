"use server";

import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function sha256Hex(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

type InviteInfo =
  | {
      valid: true;
      email: string;
      expiresAt: string | null;
      usedAt: string | null;
    }
  | {
      valid: false;
      reason: "missing_token" | "invalid" | "expired" | "used";
    };

export async function getInviteInfo(token: string): Promise<InviteInfo> {
  if (!token) return { valid: false, reason: "missing_token" };

  const supabase = createAdminClient();
  const tokenHash = sha256Hex(token);

  const { data, error } = await supabase
    .from("mammas_autorizadas")
    .select("email, invite_expires_at, invite_used_at, estado")
    .eq("invite_token_hash", tokenHash)
    .single();

  if (error || !data) return { valid: false, reason: "invalid" };
  if (data.estado !== "approved") return { valid: false, reason: "invalid" };
  if (data.invite_used_at) return { valid: false, reason: "used" };

  const now = Date.now();
  const expiresMs = data.invite_expires_at
    ? new Date(data.invite_expires_at).getTime()
    : NaN;
  if (data.invite_expires_at && Number.isFinite(expiresMs) && expiresMs <= now) {
    return { valid: false, reason: "expired" };
  }

  return {
    valid: true,
    email: data.email,
    expiresAt: data.invite_expires_at ?? null,
    usedAt: data.invite_used_at ?? null,
  };
}

export async function consumeInviteAndCreateUser(
  token: string,
  password: string
): Promise<{ success: true; email: string } | { success: false; error: string }> {
  if (!token) return { success: false, error: "Link inválido" };
  if (!password || password.length < 8) {
    return { success: false, error: "La contraseña debe tener al menos 8 caracteres" };
  }

  const supabase = createAdminClient();
  const tokenHash = sha256Hex(token);
  const nowIso = new Date().toISOString();

  // 1) Buscar invitación válida
  const { data: invite, error: inviteErr } = await supabase
    .from("mammas_autorizadas")
    .select("id, email, nombre, estado, invite_expires_at, invite_used_at")
    .eq("invite_token_hash", tokenHash)
    .eq("estado", "approved")
    .is("invite_used_at", null)
    .single();

  if (inviteErr || !invite) {
    return { success: false, error: "Link inválido o ya utilizado" };
  }

  if (invite.invite_expires_at && new Date(invite.invite_expires_at) <= new Date()) {
    return { success: false, error: "Este link de invitación ya venció" };
  }

  // 2) Crear usuario Auth
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: invite.nombre ? { nombre: invite.nombre } : undefined,
  });

  if (createErr || !created.user) {
    return {
      success: false,
      error: createErr?.message || "No se pudo crear el usuario",
    };
  }

  // 3) Best-effort: crear/actualizar profile (si existe la tabla/columnas)
  try {
    await supabase.from("profiles").upsert(
      {
        id: created.user.id,
        role: "user",
        email: invite.email,
        nombre: invite.nombre ?? null,
      },
      { onConflict: "id" }
    );
  } catch (e) {
    // No bloqueamos el flujo del MVP si el schema de profiles difiere.
    console.warn("[INVITE] Could not upsert profile:", e);
  }

  // 4) Marcar invitación como usada
  const { error: markErr } = await supabase
    .from("mammas_autorizadas")
    .update({ invite_used_at: nowIso })
    .eq("id", invite.id);

  if (markErr) {
    return { success: false, error: "Usuario creado, pero no se pudo marcar la invitación como usada" };
  }

  return { success: true, email: invite.email };
}


