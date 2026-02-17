import { prisma } from '@/lib/prisma'
import { getDefaultFrom, getTransporter, isSmtpConfigured } from '@/lib/mailer'

function formatMoney(amount: number) {
  return `$${amount.toLocaleString('es-MX')}`
}

export async function maybeSendOrderApprovedEmail(orderId: string) {
  // Si no hay SMTP configurado, no intentamos enviar (pero tampoco marcamos como enviado).
  if (!isSmtpConfigured()) {
    console.log('[order-email] SMTP no configurado, se omite envío.')
    return { ok: false as const, skipped: true as const, reason: 'SMTP_NOT_CONFIGURED' }
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) return { ok: false as const, skipped: true as const, reason: 'ORDER_NOT_FOUND' }
  if (order.status !== 'APPROVED') return { ok: false as const, skipped: true as const, reason: 'NOT_APPROVED' }
  if (!order.userEmail) return { ok: false as const, skipped: true as const, reason: 'NO_USER_EMAIL' }
  if (order.confirmationEmailSentAt) {
    return { ok: true as const, skipped: true as const, reason: 'ALREADY_SENT' }
  }

  const to = order.userEmail.trim()
  const from = getDefaultFrom()
  // Queremos que la "empresa" reciba copia del pedido.
  // Prioridad: ORDER_BCC_EMAIL (explícito) → CONTACT_TO_EMAIL (mismo que formulario de contacto).
  const bcc =
    (process.env.ORDER_BCC_EMAIL || '').trim() ||
    (process.env.CONTACT_TO_EMAIL || '').trim() ||
    undefined
  const origin = (process.env.NEXTAUTH_URL || '').trim().replace(/\/+$/, '')
  const orderLink = origin ? `${origin}/pedidos/${order.id}` : undefined

  const subject = `COP - Confirmación de pedido #${order.number}`
  const deliveryMethod =
    (order.shipping as any)?.deliveryMethod === 'PICKUP_FACTORY' || (order.shipping as any)?.deliveryMethod === 'AGREE_WITH_COMPANY'
      ? ((order.shipping as any)?.deliveryMethod as 'PICKUP_FACTORY' | 'AGREE_WITH_COMPANY')
      : null
  const whatsappPhone = (process.env.NEXT_PUBLIC_COMPANY_WHATSAPP || '').trim()
  const whatsappDigits = (whatsappPhone || '').replace(/[^\d]/g, '')
  const whatsappLink =
    deliveryMethod === 'AGREE_WITH_COMPANY' && whatsappDigits
      ? `https://wa.me/${whatsappDigits}`
      : null

  const rowsHtml = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;">${escapeHtml(i.name)}</td>
        <td style="padding:8px 0; text-align:center;">${i.quantity}</td>
        <td style="padding:8px 0; text-align:right;">${formatMoney(i.unitPrice)}</td>
        <td style="padding:8px 0; text-align:right;">${formatMoney(i.subtotal)}</td>
      </tr>`
    )
    .join('')

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif; color:#111; line-height:1.4">
    <h2 style="margin:0 0 8px 0;">¡Pago aprobado!</h2>
    <p style="margin:0 0 16px 0;">
      Confirmamos tu compra. Este es el detalle del pedido <strong>#${order.number}</strong>.
    </p>

    <table style="width:100%; border-collapse:collapse; border-top:1px solid #eee; border-bottom:1px solid #eee;">
      <thead>
        <tr>
          <th style="text-align:left; padding:10px 0;">Producto</th>
          <th style="text-align:center; padding:10px 0;">Cant.</th>
          <th style="text-align:right; padding:10px 0;">Precio</th>
          <th style="text-align:right; padding:10px 0;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <p style="margin:16px 0 0 0; font-size:16px;">
      <strong>Total:</strong> ${formatMoney(order.total)}
    </p>

    <p style="margin:16px 0 0 0;">
      <strong>Entrega:</strong>
      ${
        deliveryMethod === 'PICKUP_FACTORY'
          ? `Retiro gratis en fábrica (Sta. Bárbara, X5006 Córdoba, Argentina).`
          : deliveryMethod === 'AGREE_WITH_COMPANY'
            ? `Envío a coordinar con COP (costo a cargo del cliente). ${whatsappLink ? `WhatsApp: <a href="${whatsappLink}">${whatsappLink}</a>` : ''}`
            : `Por el momento se coordina luego de la compra. Te contactaremos para acordar la entrega.`
      }
    </p>

    ${orderLink ? `<p style="margin:16px 0 0 0;">Ver pedido: <a href="${orderLink}">${orderLink}</a></p>` : ''}

    <p style="margin:24px 0 0 0; font-size:12px; color:#555;">
      Si tenés dudas, respondé a este email o contactanos desde la web.
    </p>
  </div>`

  const textLines = [
    `Pago aprobado - Pedido #${order.number}`,
    '',
    'Detalle:',
    ...order.items.map(
      (i) => `- ${i.name} x ${i.quantity} (${formatMoney(i.unitPrice)}) = ${formatMoney(i.subtotal)}`
    ),
    '',
    `Total: ${formatMoney(order.total)}`,
    '',
    deliveryMethod === 'PICKUP_FACTORY'
      ? 'Entrega: Retiro gratis en fábrica (Sta. Bárbara, X5006 Córdoba, Argentina).'
      : deliveryMethod === 'AGREE_WITH_COMPANY'
        ? `Entrega: Envío a coordinar con COP (costo a cargo del cliente).${whatsappLink ? ` WhatsApp: ${whatsappLink}` : ''}`
        : 'Entrega: por el momento se coordina luego de la compra.',
    orderLink ? `Ver pedido: ${orderLink}` : '',
  ].filter(Boolean)

  const transporter = getTransporter()
  await transporter.sendMail({
    from,
    to,
    bcc,
    subject,
    html,
    text: textLines.join('\n'),
  })

  await prisma.order.update({
    where: { id: order.id },
    data: {
      confirmationEmailSentAt: new Date(),
      confirmationEmailSentTo: to,
    },
  })

  return { ok: true as const, skipped: false as const }
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

