interface RepairApprovalRequestCtx {
  appName: string;
  appUrl: string;
  customerName: string;
  deviceModel: string;
  costEstimate?: number | null;
  trackingUrl: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

export function repairApprovalRequestTemplate(ctx: RepairApprovalRequestCtx): {
  subject: string;
  html: string;
  text: string;
} {
  const costLine = ctx.costEstimate != null
    ? `<p style="margin:0 0 6px;font-size:13px;color:#777;text-transform:uppercase;letter-spacing:1px;">Costo estimado</p>
       <p style="margin:0;font-size:20px;font-weight:700;color:#16a34a;">${formatCurrency(ctx.costEstimate)}</p>`
    : '';

  const costText = ctx.costEstimate != null
    ? `Costo estimado: ${formatCurrency(ctx.costEstimate)}\n`
    : '';

  return {
    subject: `Se requiere tu aprobación para la reparación — ${ctx.appName}`,
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
                Tu equipo ha sido diagnosticado. Antes de continuar con la reparación,
                necesitamos tu aprobación.
              </p>
              <!-- Device Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:2px solid #f59e0b;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#777;text-transform:uppercase;letter-spacing:1px;">Equipo</p>
                    <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:#1a1a2e;">${ctx.deviceModel}</p>
                    ${costLine}
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${ctx.trackingUrl}"
                       style="display:inline-block;background:#f59e0b;color:#1a1a2e;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:15px;font-weight:700;">
                      Aprobar reparación
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#888;text-align:center;margin-top:16px;">
                También puedes ver el seguimiento completo en el enlace de arriba.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;font-size:12px;color:#aaa;">
                Si tienes dudas, comunícate directamente con nosotros.<br>
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

Tu equipo "${ctx.deviceModel}" ha sido diagnosticado y necesitamos tu aprobación para continuar con la reparación.

${costText}
Para aprobar la reparación y ver el seguimiento completo, visita:
${ctx.trackingUrl}

${ctx.appName}
`.trim(),
  };
}
