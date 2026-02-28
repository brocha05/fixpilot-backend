interface RepairStatusChangedCtx {
  appName: string;
  appUrl: string;
  customerName: string;
  deviceModel: string;
  newStatusLabel: string;
  trackingUrl: string;
}

export function repairStatusChangedTemplate(ctx: RepairStatusChangedCtx): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: `Actualización de tu reparación — ${ctx.appName}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1a1a2e;padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${ctx.appName}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:16px;color:#333;margin:0 0 16px;">Hola, <strong>${ctx.customerName}</strong>,</p>
              <p style="font-size:15px;color:#555;margin:0 0 24px;">
                Te informamos que el estado de la reparación de tu equipo ha sido actualizado.
              </p>
              <!-- Status Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#777;text-transform:uppercase;letter-spacing:1px;">Equipo</p>
                    <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:#1a1a2e;">${ctx.deviceModel}</p>
                    <p style="margin:0 0 6px;font-size:13px;color:#777;text-transform:uppercase;letter-spacing:1px;">Nuevo estado</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#2563eb;">${ctx.newStatusLabel}</p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${ctx.trackingUrl}"
                       style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:15px;font-weight:600;">
                      Ver seguimiento de mi reparación
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;font-size:12px;color:#aaa;">
                Si no solicitaste este servicio, ignora este correo.<br>
                © ${new Date().getFullYear()} ${ctx.appName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: `
Hola ${ctx.customerName},

El estado de la reparación de tu equipo "${ctx.deviceModel}" ha sido actualizado a: ${ctx.newStatusLabel}.

Consulta el seguimiento en: ${ctx.trackingUrl}

${ctx.appName}
`.trim(),
  };
}
