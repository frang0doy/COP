import { NextRequest, NextResponse } from 'next/server'

// Nota: en desarrollo (localhost) Mercado Pago no puede pegarle a este endpoint,
// pero lo dejamos para producción (URL pública) y para que no falle notification_url.
export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: true })
}

export async function GET(_req: NextRequest) {
  return NextResponse.json({ ok: true })
}

