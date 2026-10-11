import { getUserDetailsMap } from "@/lib/user-utils";
import {
  sendAportacionDesactivadaEmail,
  sendAportacionRevisadaEmail,
  sendSugerenciaAceptadaEmail,
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

/** Avisa por correo a quien sugirió un cambio que fue aceptado. No avisa si lo acepta quien lo sugirió. */
export async function notifySugerenciaAceptada({
  sugeridoPor,
  revisadoPor,
  tipo,
  titulo,
}: {
  sugeridoPor: string | null | undefined;
  revisadoPor: string;
  tipo: "proveedor" | "evento";
  titulo: string;
}): Promise<boolean> {
  if (!sugeridoPor || sugeridoPor === revisadoPor) return true;

  try {
    const users = await getUserDetailsMap([sugeridoPor]);
    const user = users[sugeridoPor];
    if (!user?.email) return false;

    await sendSugerenciaAceptadaEmail({ to: user.email, nombre: user.nombre, tipo, titulo });
    return true;
  } catch (err) {
    console.error("Error notifying accepted suggestion:", err);
    return false;
  }
}
