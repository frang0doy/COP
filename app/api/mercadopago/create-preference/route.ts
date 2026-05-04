import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { prisma } from '@/lib/prisma'
import { checkoutStockValidationError } from '@/lib/meter-stock-pool'
import { getDiscountPercent, getOrderLineUnitCents, isWholesaleListEligible } from '@/lib/pricing'
import type { MarmoltexFinish } from '@/lib/marmoltex-finish'
import { resolveOrderLineTitle } from '@/lib/marmoltex-finish'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Inicializar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
  },
})

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
        id: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().min(1),
        marmoltexFinish: z.enum(['CON_GRANO', 'SIN_GRANO', 'RODILLO']).optional(),
      })
    )
    .min(1),
  shipping: ShippingSchema,
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'MP_ACCESS_TOKEN no configurado' },
        { status: 500 }
      )
    }

    const requestOrigin = new URL(request.url).origin
    const envBaseUrl = (process.env.NEXTAUTH_URL || '').trim()
    const baseUrl = (() => {
      if (envBaseUrl) {
        try {
          return new URL(envBaseUrl).origin
        } catch {
          // ignore
        }
      }
      return requestOrigin
    })()

    const json = await request.json()
    const body = BodySchema.parse(json)

    // Crear preferencia de pago
    const preference = new Preference(client)

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
      include: { meterStockPool: true },
    })

    const byId = new Map(products.map((p) => [p.id, p]))

    const mpItems: Array<{
      id: string
      title: string
      quantity: number
      unit_price: number
      currency_id: string
    }> = []

    const orderItemsCreate: Array<{
      productId: number
      name: string
      unitPrice: number
      quantity: number
      subtotal: number
    }> = []

    let total = 0
    let retailTotal = 0
    const itemsCount = normalizedItems.reduce((sum, i) => sum + i.quantity, 0)

    // Seguridad: el descuento NO puede depender de un userId enviado por el cliente.
    // Se calcula siempre con el usuario autenticado.
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, customerType: true, wholesaleStatus: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
    }

    const userEmail = (user.email ?? session.user.email ?? body.shipping.email).trim().toLowerCase()
    const shipping = { ...body.shipping, email: userEmail, cuit: (body.shipping.cuit ?? '').trim() }

    const qtySumByProductId = new Map<number, number>()
    for (const i of normalizedItems) {
      qtySumByProductId.set(i.id, (qtySumByProductId.get(i.id) ?? 0) + i.quantity)
    }

    for (const i of normalizedItems) {
      const product = byId.get(i.id)
      if (!product) {
        return NextResponse.json(
          { error: `Producto no encontrado (id: ${i.id})` },
          { status: 400 }
        )
      }
    }

    const checkoutErr = checkoutStockValidationError(qtySumByProductId, [...byId.values()])
    if (checkoutErr) {
      return NextResponse.json({ error: checkoutErr }, { status: 400 })
    }

    for (const i of normalizedItems) {
      const product = byId.get(i.id)!
      retailTotal += product.price * i.quantity
    }

    const isWholesalePricing = isWholesaleListEligible({
      customerType: (user.customerType as any) ?? null,
      wholesaleStatus: (user.wholesaleStatus as any) ?? null,
    })

    const { percent } = isWholesalePricing
      ? { percent: 0 }
      : getDiscountPercent({ itemsCount, retailTotal })

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

      mpItems.push({
        id: `${product.id}-${i.marmoltexFinish ?? 's'}`,
        title: lineTitle,
        quantity: i.quantity,
        unit_price: unitPrice,
        currency_id: process.env.MP_CURRENCY_ID || 'ARS',
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

    const order = await prisma.$transaction(async (tx) => {
      return await tx.order.create({
        data: {
          userId: session.user.id,
          userEmail,
          total,
          paymentMethod: 'MERCADOPAGO' as any,
          discountPercent: percent,
          discountAmount,
          shipping,
          items: { create: orderItemsCreate },
        },
      })
    })

    const deliveryMethodParam =
      typeof shipping.deliveryMethod === 'string' && shipping.deliveryMethod.trim()
        ? `&delivery_method=${encodeURIComponent(shipping.deliveryMethod)}`
        : ''

    // Usamos baseUrl absoluto para back_urls (MP requiere URLs completas).
    const origin = baseUrl
    const hostname = (() => {
      try {
        return new URL(origin).hostname
      } catch {
        return ''
      }
    })()
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
    const isHttps = typeof origin === 'string' && origin.startsWith('https://')
    const forceAutoReturn = (process.env.MP_FORCE_AUTO_RETURN || '').toLowerCase() === 'true'
    const notificationUrl =
      process.env.MP_NOTIFICATION_URL ||
      (origin && origin.startsWith('https://')
        ? `${origin}/api/mercadopago/webhook`
        : undefined)

    const preferenceData = {
      items: mpItems,
      payer: userEmail ? { email: userEmail } : undefined,
      back_urls: {
        // Incluimos order_id para que la web pueda mostrar/validar el pedido al volver.
        success: `${origin}/checkout/success?order_id=${order.id}${deliveryMethodParam}`,
        failure: `${origin}/checkout/failure?order_id=${order.id}${deliveryMethodParam}`,
        pending: `${origin}/checkout/pending?order_id=${order.id}${deliveryMethodParam}`,
      },
      // auto_return solo es confiable con URLs públicas/https. Podés forzarlo por env si estás usando un túnel https.
      ...((isHttps || forceAutoReturn) && !isLocalhost ? { auto_return: 'approved' as const } : {}),
      external_reference: order.id,
      metadata: {
        orderId: order.id,
        orderNumber: order.number ?? undefined,
      },
      // En producción, MP suele exigir una URL pública/https para webhooks.
      // En local (http://localhost:xxxx) lo omitimos para evitar errores de políticas.
      notification_url: notificationUrl,
    }

    const response = await preference.create({ body: preferenceData })

    await prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId: response.id ?? null },
    })

    return NextResponse.json({
      init_point: response.init_point,
      preference_id: response.id,
      order_id: order.id,
    })
  } catch (error: any) {
    console.error('Error creating Mercado Pago preference:', error)
    const status = error?.name === 'ZodError' ? 400 : 500
    return NextResponse.json(
      { error: status === 400 ? 'Datos inválidos' : 'Error al crear la preferencia de pago' },
      { status }
    )
  }
}




