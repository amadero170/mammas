import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInviteEmailParams {
  to: string;
  nombre: string;
  inviteUrl: string;
}

export async function sendInviteEmail({
  to,
  nombre,
  inviteUrl,
}: SendInviteEmailParams) {
  // En desarrollo, usa onboarding@resend.dev
  // En producción, cambia por tu dominio verificado
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Mammas Bahía <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: "¡Tu solicitud fue aprobada! - Mammas Bahía",
    html: `
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
                ¡Hola ${nombre}! 👋
              </h2>
              
              <p style="margin: 0 0 24px 0; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                ¡Buenas noticias! Tu solicitud de acceso a <strong>Mammas Bahía</strong> ha sido <span style="color: #16a34a; font-weight: 600;">aprobada</span>.
              </p>
              
              <p style="margin: 0 0 32px 0; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Para completar tu registro y unirte a nuestra comunidad, haz clic en el siguiente botón:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px 0;">
                    <a href="${inviteUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
                      Completar mi registro →
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  <strong>⏰ Importante:</strong> Este enlace expira en 7 días. Si no puedes hacer clic en el botón, copia y pega este link en tu navegador:
                </p>
                <p style="margin: 8px 0 0 0; word-break: break-all;">
                  <a href="${inviteUrl}" style="color: #7c3aed; font-size: 13px;">${inviteUrl}</a>
                </p>
              </div>
              
              <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                Si no solicitaste acceso a Mammas Bahía, puedes ignorar este mensaje de forma segura.
              </p>
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
    `,
  });

  if (error) {
    console.error("Error sending invite email:", error);
    throw error;
  }

  return data;
}
