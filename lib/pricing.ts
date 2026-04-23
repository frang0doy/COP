export type CustomerType = 'RETAIL' | 'WHOLESALE'
export type WholesaleStatus = 'PENDING' | 'APPROVED'
export type WholesaleTier = 'NEW' | 'HISTORICAL'

export type DiscountReason = 'RETAIL_10_ITEMS' | 'RETAIL_500K' | null

/** Promociones automáticas solo para minoristas (cantidad / monto). */
export function getDiscountPercent(params: { itemsCount: number; retailTotal: number }): {
  percent: number
  reason: DiscountReason
} {
  const { itemsCount, retailTotal } = params
  const byItems = itemsCount >= 10 ? 5 : 0
  const byAmount = retailTotal >= 500000 ? 10 : 0
  const percent = Math.max(byItems, byAmount)
  const reason: DiscountReason =
    percent === 10 ? 'RETAIL_500K' : percent === 5 ? 'RETAIL_10_ITEMS' : null

  return { percent, reason }
}

export function isWholesaleListEligible(params: {
  customerType?: CustomerType | null
  wholesaleStatus?: WholesaleStatus | null
}): boolean {
  return params.customerType === 'WHOLESALE' && params.wholesaleStatus === 'APPROVED'
}

export function getCartItemUnitCents(
  item: { price: number; wholesalePrice?: number | null },
  isWholesaleApproved: boolean
): number {
  const retail = Math.max(0, Math.floor(Number.isFinite(item.price) ? item.price : 0))
  if (!isWholesaleApproved) return retail
  const w = item.wholesalePrice
  if (w == null || !Number.isFinite(w)) return retail
  return Math.max(0, Math.floor(w))
}

export function getCartSubtotalCents(
  items: Array<{ price: number; wholesalePrice?: number | null; quantity: number }>,
  isWholesaleApproved: boolean
): number {
  return items.reduce(
    (sum, item) => sum + getCartItemUnitCents(item, isWholesaleApproved) * item.quantity,
    0
  )
}

/** Precio unitario para un ítem de pedido en servidor (MP / fábrica). */
export function getOrderLineUnitCents(
  product: { price: number; wholesalePrice: number | null },
  opts: { isWholesaleApproved: boolean; retailDiscountPercent: number }
): number {
  const retail = Math.max(0, Math.floor(product.price))
  if (opts.isWholesaleApproved) {
    if (product.wholesalePrice == null) return retail
    return Math.max(0, Math.floor(product.wholesalePrice))
  }
  const { discounted } = applyPercentDiscount(retail, opts.retailDiscountPercent)
  return discounted
}

export function applyPercentDiscount(amount: number, percent: number) {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0
  const safePercent = Number.isFinite(percent) ? Math.min(100, Math.max(0, Math.floor(percent))) : 0
  const discounted = Math.round((safeAmount * (100 - safePercent)) / 100)
  const discountAmount = Math.max(0, safeAmount - discounted)
  return { discounted, discountAmount }
}
