import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveProductImage } from './image-utils'
import { getTechnicalSheetById, getTechnicalSummaryById } from '@/components/products/catalog'
import {
  isPrismaConnectionError,
  jsonProductListFromCatalog,
  withPrismaRetry,
} from '@/lib/product-api-fallback'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const products = await withPrismaRetry(() =>
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { id: 'asc' },
      })
    )

    const withResolvedImages = await Promise.all(
      products.map(async (p) => ({
        ...p,
        image: await resolveProductImage(p.image),
        technicalSummary: getTechnicalSummaryById(p.id) ?? p.technicalSummary,
        technicalSheet: getTechnicalSheetById(p.id) ?? p.technicalSheet,
      }))
    )

    return NextResponse.json(withResolvedImages)
  } catch (e) {
    if (!isPrismaConnectionError(e)) throw e

    const fallback = await jsonProductListFromCatalog()
    return NextResponse.json(fallback, {
      headers: {
        'X-Product-Fallback': 'catalog',
      },
    })
  }
}

