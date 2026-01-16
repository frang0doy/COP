import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { confirmOrder, type OrderConfirmStatus } from '@/lib/orders'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: { timeout: 5000 },
})

function mapMpStatus(status?: string): OrderConfirmStatus {
  const s = (status ?? '').toLowerCase()
  if (s === 'approved') return 'APPROVED'
  if (s === 'rejected' || s === 'cancelled') return 'REJECTED'
  return 'PENDING'
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ ok: false, error: 'MP_ACCESS_TOKEN no configurado' }, { status: 500 })
    }

    // MP manda parámetros distintos según el tipo de integración:
    // - type=payment&data.id=...
    // - topic=payment&id=...
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || searchParams.get('topic')

    if (type !== 'payment') {
      // Ignoramos otros eventos (merchant_order, etc.)
      return NextResponse.json({ ok: true })
    }

    const json = await req.json().catch(() => ({} as any))
    const paymentId =
      searchParams.get('id') ||
      searchParams.get('data.id') ||
      json?.data?.id ||
      json?.id

    if (!paymentId) {
      return NextResponse.json({ ok: false, error: 'paymentId faltante' }, { status: 400 })
    }

    const payment = new Payment(client)
    const paymentInfo: any = await payment.get({ id: paymentId })

    const orderId: string | undefined =
      paymentInfo?.external_reference ||
      paymentInfo?.metadata?.orderId ||
      paymentInfo?.metadata?.order_id

    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'external_reference faltante' }, { status: 400 })
    }

    const status = mapMpStatus(paymentInfo?.status)

    await confirmOrder({
      orderId,
      paymentId: String(paymentId),
      status,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('MP webhook error:', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'Error' }, { status: 500 })
  }
}

export async function GET(_req: NextRequest) {
  return NextResponse.json({ ok: true })
}

