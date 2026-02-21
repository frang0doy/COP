import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin'
import { confirmOrder } from '@/lib/orders'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!session.user.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const orderId = (params.id || '').trim()
    if (!orderId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, paymentMethod: true, status: true },
    })
    if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

    if (order.status !== 'PENDING') {
      return NextResponse.json({ error: 'El pedido no está pendiente' }, { status: 400 })
    }

    // Confirmación manual aplica principalmente a PAY_AT_FACTORY.
    const updated = await confirmOrder({
      orderId,
      status: 'APPROVED',
      paymentId: null,
      setPaymentFields: order.paymentMethod === 'MERCADOPAGO',
    })

    const full = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    return NextResponse.json({ ok: true, order: full ?? updated })
  } catch (e: any) {
    const message = e?.message ? String(e.message) : 'No se pudo confirmar'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

