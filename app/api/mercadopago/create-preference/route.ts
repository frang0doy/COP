import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { prisma } from '@/lib/prisma'
import { applyPercentDiscount, getDiscountPercent } from '@/lib/pricing'

// Inicializar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
  },
})

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { items, userId, userEmail, shipping } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No hay items en el carrito' },
        { status: 400 }
      )
    }

    // Crear preferencia de pago
    const preference = new Preference(client)

    const normalizedItems = (items as Array<{ id: number; quantity: number }>).map(
      (i) => ({
        id: Number(i.id),
        quantity: Math.max(1, Math.floor(Number(i.quantity))),
      })
    )

    const ids = Array.from(new Set(normalizedItems.map((i) => i.id))).filter((id) =>
      Number.isFinite(id)
    )

    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
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

    const user =
      userId
        ? await prisma.user.findUnique({
            where: { id: String(userId) },
            select: { customerType: true, wholesaleStatus: true, wholesaleTier: true },
          })
        : null

    for (const i of normalizedItems) {
      const product = byId.get(i.id)
      if (!product) {
        return NextResponse.json(
          { error: `Producto no encontrado (id: ${i.id})` },
          { status: 400 }
        )
      }

      const availableStock = Math.max(0, product.stock)
      if (availableStock <= 0) {
        return NextResponse.json(
          { error: `Sin stock para "${product.name}"` },
          { status: 400 }
        )
      }

      if (i.quantity > availableStock) {
        return NextResponse.json(
          {
            error: `Cantidad inválida para "${product.name}". Stock disponible: ${availableStock}.`,
          },
          { status: 400 }
        )
      }

      const retailSubtotal = product.price * i.quantity
      retailTotal += retailSubtotal

      // se recalcula el descuento cuando ya tenemos retailTotal
    }

    const { percent } = getDiscountPercent({
      customerType: (user?.customerType as any) ?? null,
      wholesaleStatus: (user?.wholesaleStatus as any) ?? null,
      wholesaleTier: (user?.wholesaleTier as any) ?? null,
      itemsCount,
      retailTotal,
    })

    for (const i of normalizedItems) {
      const product = byId.get(i.id)!
      const { discounted: unitPrice } = applyPercentDiscount(product.price, percent)
      const subtotal = unitPrice * i.quantity
      total += subtotal

      mpItems.push({
        id: String(product.id),
        title: product.name,
        quantity: i.quantity,
        unit_price: unitPrice,
        currency_id: process.env.MP_CURRENCY_ID || 'ARS',
      })

      orderItemsCreate.push({
        productId: product.id,
        name: product.name,
        unitPrice,
        quantity: i.quantity,
        subtotal,
      })
    }

    const discountAmount = Math.max(0, retailTotal - total)

    const order = await prisma.$transaction(async (tx) => {
      return await tx.order.create({
        data: {
          userId: userId ?? null,
          userEmail: userEmail ?? shipping?.email ?? null,
          total,
          paymentMethod: 'MERCADOPAGO' as any,
          discountPercent: percent,
          discountAmount,
          shipping: shipping ?? null,
          items: { create: orderItemsCreate },
        },
      })
    })

    const deliveryMethodParam =
      typeof shipping?.deliveryMethod === 'string' && shipping.deliveryMethod.trim()
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
    return NextResponse.json(
      {
        error: 'Error al crear la preferencia de pago',
        details: error?.message ?? 'Error',
        mp: error?.cause ?? error,
      },
      { status: 500 }
    )
  }
}




