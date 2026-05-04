import type { MeterStockPool, Product, Prisma } from '@prisma/client'

export type ProductWithOptionalPool = Pick<
  Product,
  'id' | 'sku' | 'name' | 'stock' | 'meterStockPoolId' | 'meterConsumePerQty'
> & {
  meterStockPool?: MeterStockPool | null
}

/** JSON extra en APIs públicas para SKU con pool por metros */
export type PublicMeterConsume = { meterConsumePerCartQty: number }

export function publicMeterConsumeField(p: Pick<Product, 'meterStockPoolId' | 'meterConsumePerQty'>):
  | PublicMeterConsume
  | Record<string, never> {
  const per = p.meterConsumePerQty
  if (
    p.meterStockPoolId != null &&
    typeof per === 'number' &&
    Number.isFinite(per) &&
    per > 0
  ) {
    return { meterConsumePerCartQty: Math.floor(per) }
  }
  return {}
}

/** Metros efectivos disponibles si el ítem viene del pool recién leído. */
export function availableMetersForProduct(p: ProductWithOptionalPool): number {
  const poolId = p.meterStockPoolId ?? null
  if (poolId != null && p.meterStockPool) {
    return Math.max(0, p.meterStockPool.meters)
  }
  return Math.max(0, p.stock)
}

/** Valida disponibilidad: productos sin pool por `stock`; con pool agrupa metros necesarios vs `meterStockPool.meters`. */
export function checkoutStockValidationError(
  qtyByProductId: Map<number, number>,
  products: ProductWithOptionalPool[]
): string | null {
  const poolNeeded = new Map<number, number>()
  const poolAvailable = new Map<number, number>()

  const byId = new Map<number, ProductWithOptionalPool>()
  for (const p of products) {
    byId.set(p.id, p)
    const pid = p.meterStockPoolId
    if (pid != null && p.meterStockPool && !poolAvailable.has(pid)) {
      poolAvailable.set(pid, Math.max(0, p.meterStockPool.meters))
    }
  }

  for (const [prodId, sumQty] of qtyByProductId) {
    const p = byId.get(prodId)
    if (!p) continue

    const poolId = p.meterStockPoolId
    const per = p.meterConsumePerQty
    const consume = typeof per === 'number' && Number.isFinite(per) && per > 0 ? per : 1

    if (poolId != null) {
      if (!p.meterStockPool) {
        return `Inventario compartido no disponible para "${p.name}".`
      }
      poolNeeded.set(poolId, (poolNeeded.get(poolId) ?? 0) + sumQty * consume)
      continue
    }

    const availableUnits = Math.max(0, p.stock)
    if (availableUnits <= 0) {
      return `Sin stock para "${p.name}"`
    }
    if (sumQty > availableUnits) {
      return `Cantidad inválida para "${p.name}". Stock disponible: ${availableUnits}.`
    }
  }

  for (const [poolId, need] of poolNeeded) {
    const have = poolAvailable.get(poolId)
    if (have == null) {
      return `Stock por metros insuficiente (pool ${poolId}).`
    }
    if (have <= 0) {
      return `Sin stock para productos vendidos por metros.`
    }
    if (need > have) {
      return `Metros solicitados (${need}) superan el disponible (${have}). Ajustá el carrito.`
    }
  }

  return null
}

export async function syncProductsStockMirrors(params: {
  tx: Prisma.TransactionClient
  poolId: number
  meters: number
}) {
  const { tx, poolId, meters } = params
  const next = Math.max(0, Math.floor(meters))
  await tx.meterStockPool.update({
    where: { id: poolId },
    data: { meters: next },
  })
  await tx.product.updateMany({
    where: { meterStockPoolId: poolId },
    data: { stock: next },
  })
}
