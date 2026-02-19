import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveProductImage } from '../image-utils'
import { getTechnicalSummaryById } from '@/components/products/catalog'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const product = await prisma.product.findFirst({ where: { id, isActive: true } })
  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    ...product,
    image: await resolveProductImage(product.image),
    technicalSummary: getTechnicalSummaryById(product.id) ?? product.technicalSummary,
  })
}

