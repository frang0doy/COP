import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ConfirmBody = {
  orderId?: string
  paymentId?: string
  status?: string
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as ConfirmBody
  const orderId = body.orderId?.trim()

  if (!orderId) {
    return NextResponse.json({ error: 'orderId requerido' }, { status: 400 })
  }

  const statusRaw = (body.status ?? '').toLowerCase()
  const nextStatus =
    statusRaw === 'approved'
      ? 'APPROVED'
      : statusRaw === 'rejected' || statusRaw === 'failure'
        ? 'REJECTED'
        : 'PENDING'

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      })

      if (!order) {
        throw new Error('Pedido no encontrado')
      }

      // Si ya está aprobado, devolvemos ok (idempotente).
      if (order.status === 'APPROVED') {
        return order
      }

      if (nextStatus === 'APPROVED') {
        // Validamos stock nuevamente y descontamos.
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          })
          if (!product) {
            throw new Error(`Producto no encontrado (id: ${item.productId})`)
          }
          if (product.stock < item.quantity) {
            throw new Error(`Stock insuficiente para "${product.name}"`)
          }

          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: nextStatus as any,
          mpPaymentId: body.paymentId ?? null,
        },
      })

      return updated
    })

    return NextResponse.json({ ok: true, order: result })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Error al confirmar el pedido' },
      { status: 400 }
    )
  }
}

