export type CustomerType = 'RETAIL' | 'WHOLESALE'
export type WholesaleStatus = 'PENDING' | 'APPROVED'
export type WholesaleTier = 'NEW' | 'HISTORICAL'

export type DiscountReason =
  | 'WHOLESALE_NEW'
  | 'WHOLESALE_HISTORICAL'
  | 'RETAIL_10_ITEMS'
  | 'RETAIL_500K'
  | null

export function getDiscountPercent(params: {
  customerType?: CustomerType | null
  wholesaleStatus?: WholesaleStatus | null
  wholesaleTier?: WholesaleTier | null
  itemsCount: number
  retailTotal: number
}): { percent: number; reason: DiscountReason } {
  const {
    customerType,
    wholesaleStatus,
    wholesaleTier,
    itemsCount,
    retailTotal,
  } = params

  if (customerType === 'WHOLESALE' && wholesaleStatus === 'APPROVED') {
    if (wholesaleTier === 'HISTORICAL') return { percent: 15, reason: 'WHOLESALE_HISTORICAL' }
    if (wholesaleTier === 'NEW') return { percent: 10, reason: 'WHOLESALE_NEW' }
    // Aprobado pero sin tier definido: por seguridad no aplicamos descuento.
    return { percent: 0, reason: null }
  }

  const byItems = itemsCount >= 10 ? 5 : 0
  const byAmount = retailTotal >= 500000 ? 10 : 0
  const percent = Math.max(byItems, byAmount)
  const reason: DiscountReason =
    percent === 10 ? 'RETAIL_500K' : percent === 5 ? 'RETAIL_10_ITEMS' : null

  return { percent, reason }
}

export function applyPercentDiscount(amount: number, percent: number) {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0
  const safePercent = Number.isFinite(percent) ? Math.min(100, Math.max(0, Math.floor(percent))) : 0
  const discounted = Math.round((safeAmount * (100 - safePercent)) / 100)
  const discountAmount = Math.max(0, safeAmount - discounted)
  return { discounted, discountAmount }
}

