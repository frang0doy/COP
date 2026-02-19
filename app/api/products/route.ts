import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveProductImage } from './image-utils'
import { getTechnicalSummaryById } from '@/components/products/catalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
  })

  const withResolvedImages = await Promise.all(
    products.map(async (p) => ({
      ...p,
      image: await resolveProductImage(p.image),
      technicalSummary: getTechnicalSummaryById(p.id) ?? p.technicalSummary,
    }))
  )

  return NextResponse.json(withResolvedImages)
}

