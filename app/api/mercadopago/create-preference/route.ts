import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

// Inicializar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
  },
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, userId } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No hay items en el carrito' },
        { status: 400 }
      )
    }

    // Crear preferencia de pago
    const preference = new Preference(client)

    const preferenceData = {
      items: items.map((item: any) => ({
        title: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: 'MXN',
      })),
      payer: {
        email: userId, // En producción, obtener el email del usuario autenticado
      },
      back_urls: {
        success: `${process.env.NEXTAUTH_URL}/checkout/success`,
        failure: `${process.env.NEXTAUTH_URL}/checkout/failure`,
        pending: `${process.env.NEXTAUTH_URL}/checkout/pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXTAUTH_URL}/api/mercadopago/webhook`,
    }

    const response = await preference.create({ body: preferenceData })

    return NextResponse.json({
      init_point: response.init_point,
      preference_id: response.id,
    })
  } catch (error: any) {
    console.error('Error creating Mercado Pago preference:', error)
    return NextResponse.json(
      { error: 'Error al crear la preferencia de pago', details: error.message },
      { status: 500 }
    )
  }
}

