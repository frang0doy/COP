import { prisma } from '@/lib/prisma'
import { checkoutStockValidationError, syncProductsStockMirrors } from '@/lib/meter-stock-pool'

export type OrderConfirmStatus = 'APPROVED' | 'REJECTED' | 'PENDING'

export async function confirmOrder(params: {
  orderId: string
  paymentId?: string | null
  status: OrderConfirmStatus
  setPaymentFields?: boolean
}) {
  const { orderId, paymentId, status, setPaymentFields = true } = params

  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) throw new Error('Pedido no encontrado')

    // Idempotente: si ya está aprobado, no volvemos a descontar stock.
    if (order.status === 'APPROVED') return order

    if (status === 'APPROVED') {
      const qtyByPid = new Map<number, number>()
      for (const line of order.items) {
        qtyByPid.set(line.productId, (qtyByPid.get(line.productId) ?? 0) + line.quantity)
      }
      const pids = Array.from(qtyByPid.keys())
      const products = await tx.product.findMany({
        where: { id: { in: pids } },
        include: { meterStockPool: true },
      })
      const err = checkoutStockValidationError(qtyByPid, products)
      if (err) throw new Error(err)

      const poolDeduction = new Map<number, number>()
      const unitDeduction = new Map<number, number>()
      const byPid = new Map(products.map((p) => [p.id, p]))

      for (const item of order.items) {
        const product = byPid.get(item.productId)
        if (!product) throw new Error(`Producto no encontrado (id: ${item.productId})`)
        const poolId = product.meterStockPoolId
        const per = product.meterConsumePerQty
        const consume =
          typeof per === 'number' && Number.isFinite(per) && per > 0 ? Math.floor(per) : 1
        const q = Math.max(0, Math.floor(item.quantity))

        if (poolId != null) {
          poolDeduction.set(poolId, (poolDeduction.get(poolId) ?? 0) + q * consume)
        } else {
          unitDeduction.set(product.id, (unitDeduction.get(product.id) ?? 0) + q)
        }
      }

      for (const [poolId, meters] of poolDeduction) {
        const pool = await tx.meterStockPool.findUnique({ where: { id: poolId } })
        if (!pool) throw new Error('Pool de metros no encontrado')
        const next = Math.max(0, pool.meters - meters)
        await syncProductsStockMirrors({ tx, poolId, meters: next })
      }

      for (const [prodId, totalUnits] of unitDeduction) {
        await tx.product.update({
          where: { id: prodId },
          data: { stock: { decrement: totalUnits } },
        })
      }
    }

    return await tx.order.update({
      where: { id: orderId },
      data: {
        status: status as any,
        ...(setPaymentFields
          ? {
              mpPaymentId: paymentId ?? null,
              mpStatus:
                status === 'APPROVED'
                  ? 'approved'
                  : status === 'REJECTED'
                    ? 'rejected'
                    : 'pending',
              paidAt: status === 'APPROVED' ? new Date() : null,
            }
          : {}),
      },
    })
  })
}

