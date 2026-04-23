import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDiscountPercent, getOrderLineUnitCents, isWholesaleListEligible } from '@/lib/pricing'
import type { MarmoltexFinish } from '@/lib/marmoltex-finish'
import { resolveOrderLineTitle } from '@/lib/marmoltex-finish'

const ShippingSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(3).max(40),
    cuit: z.string().trim().max(40).optional(),
    deliveryMethod: z.enum(['PICKUP_FACTORY', 'AGREE_WITH_COMPANY']),
  })
  .strict()

const BodySchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int(),
        quantity: z.number().int().min(1),
        marmoltexFinish: z.enum(['CON_GRANO', 'SIN_GRANO', 'RODILLO']).optional(),
      })
    )
    .min(1),
  shipping: ShippingSchema,
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
      select: { customerType: true, wholesaleStatus: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
    }

    const cuit = (body.shipping.cuit ?? '').trim()
    if (
      user.customerType === 'WHOLESALE' &&
      user.wholesaleStatus === 'APPROVED' &&
      !cuit
    ) {
      return NextResponse.json({ error: 'El CUIT es obligatorio para mayoristas' }, { status: 400 })
    }

    const normalizedItems = body.items.map((i) => ({
      id: Number(i.id),
      quantity: Math.max(1, Math.floor(Number(i.quantity))),
      marmoltexFinish: (i.marmoltexFinish ?? undefined) as MarmoltexFinish | undefined,
    }))

    const ids = Array.from(new Set(normalizedItems.map((i) => i.id))).filter((id) =>
      Number.isFinite(id)
    )

    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
    })
    const byId = new Map(products.map((p) => [p.id, p]))

    const qtySumByProductId = new Map<number, number>()
    for (const i of normalizedItems) {
      qtySumByProductId.set(i.id, (qtySumByProductId.get(i.id) ?? 0) + i.quantity)
    }

    for (const i of normalizedItems) {
      const product = byId.get(i.id)
      if (!product) {
        return NextResponse.json({ error: `Producto no encontrado (id: ${i.id})` }, { status: 400 })
      }
      const availableStock = Math.max(0, product.stock)
      if (availableStock <= 0) {
        return NextResponse.json({ error: `Sin stock para "${product.name}"` }, { status: 400 })
      }
    }

    for (const [pid, sumQty] of qtySumByProductId) {
      const product = byId.get(pid)!
      const availableStock = Math.max(0, product.stock)
      if (sumQty > availableStock) {
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

    const isWholesalePricing = isWholesaleListEligible({
      customerType: user.customerType as any,
      wholesaleStatus: user.wholesaleStatus as any,
    })

    const { percent } = isWholesalePricing
      ? { percent: 0 }
      : getDiscountPercent({ itemsCount, retailTotal })

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
      const unitPrice = getOrderLineUnitCents(
        { price: product.price, wholesalePrice: product.wholesalePrice },
        { isWholesaleApproved: isWholesalePricing, retailDiscountPercent: percent }
      )
      const subtotal = unitPrice * i.quantity
      total += subtotal
      const lineTitle = resolveOrderLineTitle({
        productName: product.name,
        sku: product.sku,
        marmoltexFinish: i.marmoltexFinish ?? null,
      })

      orderItemsCreate.push({
        productId: product.id,
        name: lineTitle,
        unitPrice,
        quantity: i.quantity,
        subtotal,
      })
    }

    const discountAmount = Math.max(0, retailTotal - total)

    const userEmail = (user.email ?? session.user.email ?? body.shipping.email).trim().toLowerCase()
    const shipping = { ...body.shipping, email: userEmail, cuit: (body.shipping.cuit ?? '').trim() }

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        userEmail: userEmail ?? null,
        total,
        paymentMethod: 'PAY_AT_FACTORY' as any,
        discountPercent: percent,
        discountAmount,
        shipping,
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

