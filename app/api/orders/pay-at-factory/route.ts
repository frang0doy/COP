import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { applyPercentDiscount, getDiscountPercent } from '@/lib/pricing'

const BodySchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  shipping: z.any().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const json = await req.json()
    const body = BodySchema.parse(json)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { customerType: true, wholesaleStatus: true, wholesaleTier: true, email: true },
    })

    const canPayAtFactory =
      user?.customerType === 'WHOLESALE' &&
      user?.wholesaleStatus === 'APPROVED' &&
      user?.wholesaleTier === 'HISTORICAL'

    if (!canPayAtFactory) {
      return NextResponse.json({ error: 'No autorizado para pagar en fábrica' }, { status: 403 })
    }

    const normalizedItems = body.items.map((i) => ({
      id: Number(i.id),
      quantity: Math.max(1, Math.floor(Number(i.quantity))),
    }))

    const ids = Array.from(new Set(normalizedItems.map((i) => i.id))).filter((id) =>
      Number.isFinite(id)
    )

    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
    })
    const byId = new Map(products.map((p) => [p.id, p]))

    // Validación de stock (sin descontar hasta confirmación)
    for (const i of normalizedItems) {
      const product = byId.get(i.id)
      if (!product) {
        return NextResponse.json({ error: `Producto no encontrado (id: ${i.id})` }, { status: 400 })
      }
      const availableStock = Math.max(0, product.stock)
      if (availableStock <= 0) {
        return NextResponse.json({ error: `Sin stock para "${product.name}"` }, { status: 400 })
      }
      if (i.quantity > availableStock) {
        return NextResponse.json(
          { error: `Cantidad inválida para "${product.name}". Stock disponible: ${availableStock}.` },
          { status: 400 }
        )
      }
    }

    const retailTotal = normalizedItems.reduce((sum, i) => {
      const product = byId.get(i.id)!
      return sum + product.price * i.quantity
    }, 0)
    const itemsCount = normalizedItems.reduce((sum, i) => sum + i.quantity, 0)

    const { percent } = getDiscountPercent({
      customerType: user?.customerType as any,
      wholesaleStatus: user?.wholesaleStatus as any,
      wholesaleTier: user?.wholesaleTier as any,
      itemsCount,
      retailTotal,
    })

    const orderItemsCreate: Array<{
      productId: number
      name: string
      unitPrice: number
      quantity: number
      subtotal: number
    }> = []

    let total = 0
    for (const i of normalizedItems) {
      const product = byId.get(i.id)!
      const { discounted: unitPrice } = applyPercentDiscount(product.price, percent)
      const subtotal = unitPrice * i.quantity
      total += subtotal
      orderItemsCreate.push({
        productId: product.id,
        name: product.name,
        unitPrice,
        quantity: i.quantity,
        subtotal,
      })
    }

    const discountAmount = Math.max(0, retailTotal - total)

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        userEmail: user?.email ?? session.user.email ?? null,
        total,
        paymentMethod: 'PAY_AT_FACTORY' as any,
        discountPercent: percent,
        discountAmount,
        shipping: body.shipping ?? null,
        items: { create: orderItemsCreate },
      },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, order_id: order.id })
  } catch (e: any) {
    const message = e?.name === 'ZodError' ? 'Datos inválidos' : e?.message ?? 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

