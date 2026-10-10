import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// En desarrollo, usa onboarding@resend.dev
// En producción, cambia por tu dominio verificado
const fromEmail =
  process.env.RESEND_FROM_EMAIL || "Mammas Bahía <onboarding@resend.dev>";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function button(href: string, label: string) {
  return `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px 0;">
                    <a href="${href}"
                       style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
                      ${label}
                    </a>
                  </td>
                </tr>
              </table>`;
}

function paragraph(html: string) {
  return `<p style="margin: 0 0 24px 0; color: #3f3f46; font-size: 16px; line-height: 1.6;">${html}</p>`;
}

function note(html: string) {
  return `
              <div style="background-color: #f4f4f5; border-left: 4px solid #a1a1aa; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; color: #3f3f46; font-size: 14px; line-height: 1.5;">${html}</p>
              </div>`;
}

function layout(saludo: string, content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Mammas Bahía
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 24px; font-weight: 600;">
                ${saludo}
              </h2>
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 13px; text-align: center;">
                © ${new Date().getFullYear()} Mammas Bahía. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
}

async function send(to: string, subject: string, html: string) {
  const { data, error } = await resend.emails.send({ from: fromEmail, to, subject, html });
  if (error) {
    console.error(`Error sending email "${subject}":`, error);
    throw error;
  }
  return data;
}

/* ══════════════════════════════════════════════════════════
   Solicitudes de acceso
   ══════════════════════════════════════════════════════════ */

interface SendInviteEmailParams {
  to: string;
  nombre: string;
  inviteUrl: string;
}

export async function sendInviteEmail({ to, nombre, inviteUrl }: SendInviteEmailParams) {
  const html = layout(
    `¡Hola ${escapeHtml(nombre)}! 👋`,
    `
              ${paragraph(`¡Buenas noticias! Tu solicitud de acceso a <strong>Mammas Bahía</strong> ha sido <span style="color: #16a34a; font-weight: 600;">aprobada</span>.`)}
              ${paragraph("Para completar tu registro y unirte a nuestra comunidad, haz clic en el siguiente botón y crea tu contraseña:")}
              ${button(inviteUrl, "Completar mi registro →")}
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
                </p>
                <p style="margin: 8px 0 0 0; word-break: break-all;">
                  <a href="${inviteUrl}" style="color: #7c3aed; font-size: 13px;">${inviteUrl}</a>
                </p>
              </div>
              <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                Si no solicitaste acceso a Mammas Bahía, puedes ignorar este mensaje de forma segura.
              </p>`
  );
  return send(to, "¡Tu solicitud fue aprobada! - Mammas Bahía", html);
}

export async function sendSolicitudRechazadaEmail({
  to,
  nombre,
  razon,
}: {
  to: string;
  nombre: string;
  razon?: string | null;
}) {
  const html = layout(
    `Hola ${escapeHtml(nombre)}`,
    `
              ${paragraph("Gracias por tu interés en <strong>Mammas Bahía</strong>. Revisamos tu solicitud de acceso y, por ahora, no pudimos aprobarla.")}
              ${razon?.trim() ? note(`<strong>Motivo:</strong> ${escapeHtml(razon.trim())}`) : ""}
              <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                Si crees que se trata de un error, puedes enviar una nueva solicitud desde el sitio.
              </p>`
  );
  return send(to, "Sobre tu solicitud de acceso - Mammas Bahía", html);
}

/* ══════════════════════════════════════════════════════════
   Aportaciones (proveedores y eventos)
   ══════════════════════════════════════════════════════════ */

export async function sendAportacionRevisadaEmail({
  to,
  nombre,
  tipo,
  titulo,
  aprobado,
  motivo,
}: {
  to: string;
  nombre: string;
  tipo: "proveedor" | "evento";
  titulo: string;
  aprobado: boolean;
  motivo?: string | null;
}) {
  const base = siteUrl();
  const articulo = tipo === "proveedor" ? "El proveedor" : "El evento";
  const nombreItem = `<strong>${escapeHtml(titulo)}</strong>`;

  const content = aprobado
    ? `
              ${paragraph(`¡Gracias por tu aportación! ${articulo} ${nombreItem} fue <span style="color: #16a34a; font-weight: 600;">aprobado</span> y ya está visible para la comunidad.`)}
              ${button(`${base}/${tipo === "proveedor" ? "directorio" : "eventos"}`, `Ver ${tipo === "proveedor" ? "el directorio" : "los eventos"} →`)}`
    : `
              ${paragraph(`Gracias por tu aportación. Revisamos ${articulo.toLowerCase()} ${nombreItem} y, por ahora, no pudimos aprobarlo.`)}
              ${motivo?.trim() ? note(`<strong>Motivo:</strong> ${escapeHtml(motivo.trim())}`) : ""}
              ${paragraph("Puedes corregir los datos y volver a enviarlo para revisión desde tu cuenta.")}
              ${button(`${base}/dashboard/${tipo === "proveedor" ? "mis-proveedores" : "mis-eventos"}`, "Ir a mi cuenta →")}`;

  const subject = aprobado
    ? `${articulo} "${titulo}" fue aprobado - Mammas Bahía`
    : `Sobre ${articulo.toLowerCase()} "${titulo}" - Mammas Bahía`;

  return send(to, subject, layout(`Hola ${escapeHtml(nombre)}`, content));
}
