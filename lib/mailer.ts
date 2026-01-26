import nodemailer from 'nodemailer'

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD)
}

export function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT || '587')
  const secure = port === 465

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

export function getDefaultFrom() {
  // Puede ser un mail dedicado (recomendado) o el SMTP_USER.
  return process.env.SMTP_FROM || process.env.SMTP_USER || ''
}

