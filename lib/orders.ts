import { prisma } from '@/lib/prisma'

export type OrderConfirmStatus = 'APPROVED' | 'REJECTED' | 'PENDING'

export async function confirmOrder(params: {
  orderId: string
  paymentId?: string | null
  status: OrderConfirmStatus
}) {
  const { orderId, paymentId, status } = params

  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) throw new Error('Pedido no encontrado')

    // Idempotente: si ya está aprobado, no volvemos a descontar stock.
    if (order.status === 'APPROVED') return order

    if (status === 'APPROVED') {
      for (const item of order.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) throw new Error(`Producto no encontrado (id: ${item.productId})`)
        if (product.stock < item.quantity) throw new Error(`Stock insuficiente para "${product.name}"`)

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        })
      }
    }

    return await tx.order.update({
      where: { id: orderId },
      data: {
        status: status as any,
        mpPaymentId: paymentId ?? null,
      },
    })
  })
}

