import { NextRequest, NextResponse } from 'next/server'
import { confirmOrder, type OrderConfirmStatus } from '@/lib/orders'

type ConfirmBody = {
  orderId?: string
  paymentId?: string
  status?: string
}

export async function POST(req: NextRequest) {
  const secret = process.env.ORDER_CONFIRM_SECRET || 'dev-order-confirm-secret'
  const provided = req.headers.get('x-order-confirm-secret')
  if (provided !== secret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as ConfirmBody
  const orderId = body.orderId?.trim()

  if (!orderId) {
    return NextResponse.json({ error: 'orderId requerido' }, { status: 400 })
  }

  const statusRaw = (body.status ?? '').toLowerCase()
  const nextStatus: OrderConfirmStatus =
    statusRaw === 'approved'
      ? 'APPROVED'
      : statusRaw === 'rejected' || statusRaw === 'failure'
        ? 'REJECTED'
        : 'PENDING'

  try {
    const result = await confirmOrder({
      orderId,
      paymentId: body.paymentId ?? null,
      status: nextStatus,
    })

    return NextResponse.json({ ok: true, order: result })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Error al confirmar el pedido' },
      { status: 400 }
    )
  }
}

