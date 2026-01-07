import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message, to } = body

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
      console.log('Enviar a:', to)
      console.log('==========================')

      return NextResponse.json(
        { message: 'Mensaje recibido (modo desarrollo)' },
        { status: 200 }
      )
    }

    // Enviar el email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: to || 'infocoprecubrimientos@gmail.com',
      subject: `Contacto COP: ${subject}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Teléfono:</strong> ${phone || 'No proporcionado'}</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      replyTo: email,
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

