import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

type Body = {
  orderId?: string
  paymentId?: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ ok: false, error: 'MP_ACCESS_TOKEN no configurado' }, { status: 500 })
    }

    const body = (await req.json().catch(() => ({}))) as Body
    const orderId = body.orderId?.trim()
    const paymentId = body.paymentId?.trim()

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { ok: false, error: 'orderId y paymentId son requeridos' },
        { status: 400 }
      )
    }

    // Seguridad: el pedido debe pertenecer al usuario logueado.
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true },
    })

    if (!order) {
      return NextResponse.json({ ok: false, error: 'Pedido no encontrado' }, { status: 404 })
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 })
    }

    const payment = new Payment(client)
    const paymentInfo: any = await payment.get({ id: paymentId })

    const externalRef: string | undefined =
      paymentInfo?.external_reference ||
      paymentInfo?.metadata?.orderId ||
      paymentInfo?.metadata?.order_id

    if (!externalRef || externalRef !== orderId) {
      return NextResponse.json(
        { ok: false, error: 'El pago no corresponde a este pedido' },
        { status: 400 }
      )
    }

    const status = mapMpStatus(paymentInfo?.status)

    const updated = await confirmOrder({
      orderId,
      paymentId,
      status,
    })

    return NextResponse.json({
      ok: true,
      order: { id: updated.id, status: updated.status, mpPaymentId: updated.mpPaymentId },
    })
  } catch (e: any) {
    console.error('MP sync error:', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'Error' }, { status: 500 })
  }
}

