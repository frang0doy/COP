import { PRODUCTS, getTechnicalSheetById, getTechnicalSummaryById } from '@/components/products/catalog'
import { resolveProductImage } from '@/app/api/products/image-utils'

/** P1001 = can't reach database (Neon dormido, red, etc.) */
export function isPrismaConnectionError(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false
  const code = (e as { code?: string }).code
  return code === 'P1001' || code === 'P1000'
}

export async function withPrismaRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let last: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      last = e
      if (!isPrismaConnectionError(e) || i === attempts - 1) throw e
      await new Promise((r) => setTimeout(r, 900))
    }
  }
  throw last
}

/**
 * Respuesta compatible con GET /api/products/[id] usando solo el catálogo en código.
 * Solo existe para IDs del seed base (1–42 típ.); variantes creadas solo en BD no aparecen.
 */
export async function jsonProductFromCatalogId(id: number) {
  const p = PRODUCTS.find((x) => x.id === id)
  if (!p) return null

  const image = await resolveProductImage(p.image)
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price,
    stock: p.stock,
    image,
    isNew: Boolean(p.isNew),
    technicalSheet: getTechnicalSheetById(p.id) ?? p.technicalSheet ?? null,
    technicalSummary: getTechnicalSummaryById(p.id) ?? p.technicalSummary ?? null,
    isActive: true,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  }
}

export async function jsonProductListFromCatalog() {
  const list = [...PRODUCTS].sort((a, b) => a.id - b.id)
  return Promise.all(
    list.map(async (p) => {
      const image = await resolveProductImage(p.image)
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        stock: p.stock,
        image,
        isNew: Boolean(p.isNew),
        technicalSheet: getTechnicalSheetById(p.id) ?? p.technicalSheet ?? null,
        technicalSummary: getTechnicalSummaryById(p.id) ?? p.technicalSummary ?? null,
        isActive: true,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      }
    })
  )
}
