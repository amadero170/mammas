import { getUserDetailsMap } from "@/lib/user-utils";
import { sendAportacionRevisadaEmail } from "@/lib/email/resend";

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
