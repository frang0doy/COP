import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'franciscogodoy_@hotmail.com'

function escapeHtml(input: unknown) {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    // Configurar el transporter de nodemailer
    // En producción, usa variables de entorno para las credenciales
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Si no hay credenciales configuradas, usar un servicio de prueba o log
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('=== MENSAJE DE CONTACTO ===')
      console.log('De:', name, `<${email}>`)
      console.log('Teléfono:', phone)
      console.log('Asunto:', subject)
      console.log('Mensaje:', message)
      console.log('Enviar a:', CONTACT_TO_EMAIL)
      console.log('==========================')

      return NextResponse.json(
        {
          error:
            'SMTP no configurado. Definí SMTP_USER y SMTP_PASSWORD en .env.local y reiniciá el servidor.',
        },
        { status: 503 }
      )
    }

    // Enviar el email
    const safeName = escapeHtml(name).trim()
    const safeEmail = escapeHtml(email).trim()
    const safePhone = escapeHtml(phone).trim()
    const safeSubject = escapeHtml(subject).trim()
    const safeMessage = escapeHtml(message).trim()

    const from = process.env.SMTP_FROM || process.env.SMTP_USER
    const now = new Date()
    const metaLine = `Enviado desde el formulario de contacto · ${now.toLocaleString('es-AR')}`

    const mailOptions = {
      from,
      to: CONTACT_TO_EMAIL,
      subject: `[COP] Contacto · ${safeSubject || 'Sin asunto'} (${safeName || 'Sin nombre'})`,
      text: [
        'Nuevo mensaje desde el formulario de contacto (COP)',
        '',
        `Nombre: ${safeName || 'No proporcionado'}`,
        `Email: ${safeEmail || 'No proporcionado'}`,
        `Teléfono: ${safePhone || 'No proporcionado'}`,
        `Asunto: ${safeSubject || 'Sin asunto'}`,
        '',
        'Mensaje:',
        safeMessage || '(Vacío)',
        '',
        metaLine,
      ].join('\n'),
      html: `
        <div style="background:#f5f5f5;padding:24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:#111;">
          <div style="max-width:680px;margin:0 auto;">
            <div style="background:#ffffff;border:1px solid #e5e5e5;">
              <div style="padding:18px 20px;border-bottom:1px solid #e5e5e5;">
                <div style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#525252;font-weight:700;">
                  Contacto
                </div>
                <div style="margin-top:6px;font-size:22px;font-weight:800;line-height:1.2;">
                  Nuevo mensaje para COP
                </div>
                <div style="margin-top:8px;font-size:12px;color:#737373;">
                  ${escapeHtml(metaLine)}
                </div>
              </div>

              <div style="padding:18px 20px;">
                <div style="display:grid;grid-template-columns:1fr;gap:10px;">
                  <div style="border:1px solid #e5e5e5;padding:12px;">
                    <div style="font-size:12px;color:#737373;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Nombre</div>
                    <div style="margin-top:4px;font-size:14px;color:#111;font-weight:600;">${safeName || 'No proporcionado'}</div>
                  </div>
                  <div style="border:1px solid #e5e5e5;padding:12px;">
                    <div style="font-size:12px;color:#737373;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Email</div>
                    <div style="margin-top:4px;font-size:14px;color:#111;font-weight:600;">
                      <a href="mailto:${safeEmail}" style="color:#111;text-decoration:underline;">${safeEmail || 'No proporcionado'}</a>
                    </div>
                  </div>
                  <div style="border:1px solid #e5e5e5;padding:12px;">
                    <div style="font-size:12px;color:#737373;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Teléfono</div>
                    <div style="margin-top:4px;font-size:14px;color:#111;font-weight:600;">${safePhone || 'No proporcionado'}</div>
                  </div>
                  <div style="border:1px solid #e5e5e5;padding:12px;">
                    <div style="font-size:12px;color:#737373;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Asunto</div>
                    <div style="margin-top:4px;font-size:14px;color:#111;font-weight:700;">${safeSubject || 'Sin asunto'}</div>
                  </div>
                </div>

                <div style="margin-top:14px;border:1px solid #e5e5e5;background:#fafafa;padding:14px;">
                  <div style="font-size:12px;color:#737373;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Mensaje</div>
                  <div style="margin-top:8px;font-size:14px;line-height:1.6;color:#111;white-space:pre-wrap;">${safeMessage || '(Vacío)'}</div>
                </div>
              </div>

              <div style="padding:14px 20px;border-top:1px solid #e5e5e5;font-size:12px;color:#737373;">
                Responder a este correo contestará al remitente (${safeEmail || 'sin email'}).
              </div>
            </div>
          </div>
        </div>
      `,
      replyTo: safeEmail || undefined,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json(
      { message: 'Mensaje enviado correctamente' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error al enviar email:', error)
    return NextResponse.json(
      { error: 'Error al enviar el mensaje' },
      { status: 500 }
    )
  }
}




