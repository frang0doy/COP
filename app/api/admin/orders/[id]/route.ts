import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function DELETE(
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
      select: { id: true, status: true, paymentMethod: true },
    })
    if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

    if (!(order.status === 'PENDING' && order.paymentMethod === 'MERCADOPAGO')) {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar pedidos pendientes de Mercado Pago' },
        { status: 400 }
      )
    }

    await prisma.order.delete({ where: { id: orderId } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const message = e?.message ? String(e.message) : 'No se pudo eliminar el pedido'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
