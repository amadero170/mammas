import { getUserDetailsMap } from "@/lib/user-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendAportacionDesactivadaEmail,
  sendAportacionRevisadaEmail,
  sendNuevaCargaAdminEmail,
  type NuevaCargaTipo,
} from "@/lib/email/resend";

/**
 * Avisa por correo a quien cargó un proveedor/evento que fue aprobado o rechazado.
 * No avisa si quien revisa es la misma persona que lo cargó.
 * Devuelve false si el correo no se pudo enviar (la revisión queda guardada igual).
 */
export async function notifyAportacionRevisada({
  creadoPor,
  revisadoPor,
  tipo,
  titulo,
  aprobado,
  motivo,
}: {
  creadoPor: string | null | undefined;
  revisadoPor: string;
  tipo: "proveedor" | "evento";
  titulo: string;
  aprobado: boolean;
  motivo?: string | null;
}): Promise<boolean> {
  if (!creadoPor || creadoPor === revisadoPor) return true;

  try {
    const users = await getUserDetailsMap([creadoPor]);
    const creator = users[creadoPor];
    if (!creator?.email) return false;

    await sendAportacionRevisadaEmail({
      to: creator.email,
      nombre: creator.nombre,
      tipo,
      titulo,
      aprobado,
      motivo,
    });
    return true;
  } catch (err) {
    console.error("Error notifying review:", err);
    return false;
  }
}

/**
 * Avisa por correo a quien cargó un proveedor/evento que una admin lo desactivó.
 * Misma lógica que notifyAportacionRevisada: no avisa si lo desactiva quien lo cargó.
 */
export async function notifyAportacionDesactivada({
  creadoPor,
  revisadoPor,
  tipo,
  titulo,
  motivo,
}: {
  creadoPor: string | null | undefined;
  revisadoPor: string;
  tipo: "proveedor" | "evento";
  titulo: string;
  motivo?: string | null;
}): Promise<boolean> {
  if (!creadoPor || creadoPor === revisadoPor) return true;

  try {
    const users = await getUserDetailsMap([creadoPor]);
    const creator = users[creadoPor];
    if (!creator?.email) return false;

    await sendAportacionDesactivadaEmail({
      to: creator.email,
      nombre: creator.nombre,
      tipo,
      titulo,
      motivo,
    });
    return true;
  } catch (err) {
    console.error("Error notifying deactivation:", err);
    return false;
  }
}

/**
 * Avisa a todas las administradoras que hay algo nuevo pendiente de revisión.
 * Nunca falla: si el correo no sale, la carga queda guardada igual.
 */
export async function notifyAdminsNuevaCarga({
  tipo,
  titulo,
  autorId,
  reenvio = false,
}: {
  tipo: NuevaCargaTipo;
  titulo: string;
  autorId?: string | null;
  reenvio?: boolean;
}): Promise<void> {
  try {
    const adminSupabase = createAdminClient();
    const { data: admins } = await adminSupabase.from("profiles").select("id").eq("role", "admin");
    const adminIds = (admins ?? []).map((a: { id: string }) => a.id);
    if (adminIds.length === 0) return;

    const users = await getUserDetailsMap(autorId ? [...adminIds, autorId] : adminIds);
    const to = adminIds.map((id) => users[id]?.email).filter((e): e is string => !!e);
    if (to.length === 0) return;

    await sendNuevaCargaAdminEmail({
      to,
      tipo,
      titulo,
      autor: (autorId && users[autorId]?.nombre) || "Una mamá",
      reenvio,
    });
  } catch (err) {
    console.error("Error notifying admins:", err);
  }
}
