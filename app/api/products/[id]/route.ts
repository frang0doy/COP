import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveProductImage } from '../image-utils'
import { getTechnicalSheetById, getTechnicalSummaryById } from '@/components/products/catalog'
import {
  isPrismaConnectionError,
  jsonProductFromCatalogId,
  withPrismaRetry,
} from '@/lib/product-api-fallback'
import { shouldExposeWholesalePrice, toPublicProductJson } from '@/lib/public-product'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    const product = await withPrismaRetry(() =>
      prisma.product.findFirst({ where: { id, isActive: true } })
    )
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const showWs = await shouldExposeWholesalePrice()
    const publicP = toPublicProductJson(product, { includeWholesalePrice: showWs })

    return NextResponse.json({
      ...publicP,
      image: await resolveProductImage(product.image),
      technicalSummary: getTechnicalSummaryById(product.id) ?? product.technicalSummary,
      technicalSheet: getTechnicalSheetById(product.id) ?? product.technicalSheet,
    })
  } catch (e) {
    if (!isPrismaConnectionError(e)) throw e

    const fallback = await jsonProductFromCatalogId(id)
    if (fallback) {
      return NextResponse.json(fallback, {
        headers: {
          'X-Product-Fallback': 'catalog',
        },
      })
    }

    return NextResponse.json(
      {
        error:
          'No pudimos conectar con la base de datos. Esperá unos segundos (Neon suele despertar) y recargá.',
      },
      { status: 503 }
    )
  }
}

