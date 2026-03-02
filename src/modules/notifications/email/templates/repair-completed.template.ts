interface RepairCompletedCtx {
  appName: string;
  appUrl: string;
  customerName: string;
  deviceModel: string;
  finalPrice?: number | null;
  trackingUrl: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function repairCompletedTemplate(ctx: RepairCompletedCtx): {
  subject: string;
  html: string;
  text: string;
} {
  const priceLine =
    ctx.finalPrice != null
      ? `<p style="margin:16px 0 6px;font-size:13px;color:#777;text-transform:uppercase;letter-spacing:1px;">Total a pagar</p>
       <p style="margin:0;font-size:22px;font-weight:700;color:#16a34a;">${formatCurrency(ctx.finalPrice)}</p>`
      : '';

  const priceText =
    ctx.finalPrice != null
      ? `\nTotal a pagar: ${formatCurrency(ctx.finalPrice)}\n`
      : '';

  return {
    subject: `¡Tu equipo está listo para recoger! — ${ctx.appName}`,
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
            <td style="background:#16a34a;padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">¡Reparación completada! ✓</h1>
              <p style="margin:8px 0 0;color:#d1fae5;font-size:14px;">${ctx.appName}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:16px;color:#333;margin:0 0 16px;">¡Buenas noticias, <strong>${ctx.customerName}</strong>!</p>
              <p style="font-size:15px;color:#555;margin:0 0 24px;">
                Tu equipo ha sido reparado exitosamente y está listo para que lo recojas.
              </p>
              <!-- Device Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:2px solid #16a34a;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#777;text-transform:uppercase;letter-spacing:1px;">Equipo reparado</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#1a1a2e;">${ctx.deviceModel}</p>
                    ${priceLine}
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${ctx.trackingUrl}"
                       style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:15px;font-weight:600;">
                      Ver detalle de mi reparación
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#888;text-align:center;margin-top:16px;">
                Pasa a recoger tu equipo en nuestro establecimiento.<br>¡Gracias por tu preferencia!
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;font-size:12px;color:#aaa;">
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
¡Buenas noticias, ${ctx.customerName}!

Tu equipo "${ctx.deviceModel}" ha sido reparado exitosamente y está listo para que lo recojas.
${priceText}
Ver detalle completo: ${ctx.trackingUrl}

¡Gracias por tu preferencia!
${ctx.appName}
`.trim(),
  };
}
