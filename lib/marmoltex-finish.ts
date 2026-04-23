/** Opción de presentación / aplicación solo para familia Marmoltex (SKU REV-001*). */

export const MARMOLTEX_FINISH_OPTIONS = [
  { value: 'CON_GRANO', label: 'Con Grano' },
  { value: 'SIN_GRANO', label: 'Sin Grano' },
  { value: 'RODILLO', label: 'Aplicar con Rodillo' },
] as const

export type MarmoltexFinish = (typeof MARMOLTEX_FINISH_OPTIONS)[number]['value']

export function isMarmoltexSku(sku: string): boolean {
  return String(sku || '').toUpperCase().startsWith('REV-001')
}

export function isMarmoltexGroupBaseName(groupBase: string | null): boolean {
  return groupBase === 'Marmoltex'
}

export function marmoltexFinishLabel(finish: MarmoltexFinish): string {
  return MARMOLTEX_FINISH_OPTIONS.find((o) => o.value === finish)?.label ?? ''
}

/** Nombre que va al pedido / carrito (servidor reconstruye con el mismo criterio). */
export function marmoltexCartName(productName: string, finish: MarmoltexFinish): string {
  const label = marmoltexFinishLabel(finish)
  return `${String(productName || '').trim()} — ${label}`
}

export function getCartLineKey(productId: number, marmoltexFinish?: MarmoltexFinish | null): string {
  if (marmoltexFinish) return `${productId}::${marmoltexFinish}`
  return String(productId)
}

export function parseMarmoltexFinish(raw: unknown): MarmoltexFinish | undefined {
  if (raw !== 'CON_GRANO' && raw !== 'SIN_GRANO' && raw !== 'RODILLO') return undefined
  return raw
}

export function resolveOrderLineTitle(params: {
  productName: string
  sku: string
  marmoltexFinish?: MarmoltexFinish | null
}): string {
  const { productName, sku, marmoltexFinish } = params
  if (isMarmoltexSku(sku) && marmoltexFinish) {
    return marmoltexCartName(productName, marmoltexFinish)
  }
  return String(productName || '').trim()
}
