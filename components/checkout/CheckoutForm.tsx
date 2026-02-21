'use client'

import { useEffect, useMemo, useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useSession } from 'next-auth/react'
import { CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { applyPercentDiscount, getDiscountPercent } from '@/lib/pricing'

type Me = {
  id: string
  email: string
  name?: string | null
  phone?: string | null
  cuit?: string | null
  customerType?: 'RETAIL' | 'WHOLESALE' | null
  wholesaleStatus?: 'PENDING' | 'APPROVED' | null
  wholesaleTier?: 'NEW' | 'HISTORICAL' | null
  wholesaleDiscountPercent?: number | null
}

type DeliveryMethod = 'PICKUP_FACTORY' | 'AGREE_WITH_COMPANY'

export default function CheckoutForm() {
  const { items, total, clearCart } = useCart()
  const { data: session } = useSession()
  const factoryAddressLine1 = 'Sta. Bárbara'
  const factoryAddressLine2 = 'X5006 Córdoba, Argentina'
  const factoryAddressQuery = `${factoryAddressLine1}, ${factoryAddressLine2}`
  const factoryGoogleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(factoryAddressQuery)}`
  const [shippingData, setShippingData] = useState<{
    name: string
    email: string
    phone: string
    cuit: string
    deliveryMethod: DeliveryMethod
  }>({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    cuit: '',
    deliveryMethod: 'PICKUP_FACTORY',
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [me, setMe] = useState<Me | null>(null)
  const [showUseSavedPrompt, setShowUseSavedPrompt] = useState(false)

  const itemsCount = useMemo(
    () => items.reduce((sum, i) => sum + (i.quantity ?? 0), 0),
    [items]
  )

  const discountInfo = useMemo(() => {
    const { percent } = getDiscountPercent({
      customerType: me?.customerType ?? null,
      wholesaleStatus: me?.wholesaleStatus ?? null,
      wholesaleTier: me?.wholesaleTier ?? null,
      wholesaleDiscountPercent: me?.wholesaleDiscountPercent ?? null,
      itemsCount,
      retailTotal: total,
    })
    const { discounted, discountAmount } = applyPercentDiscount(total, percent)
    return { percent, discountedTotal: discounted, discountAmount }
  }, [me?.customerType, me?.wholesaleStatus, me?.wholesaleTier, me?.wholesaleDiscountPercent, itemsCount, total])

  const canPayAtFactory =
    me?.customerType === 'WHOLESALE' &&
    me?.wholesaleStatus === 'APPROVED'

  const hasSavedShipping = useMemo(() => {
    if (!me) return false
    return Boolean(
      (me.phone && me.phone.trim()) ||
        (me.name && me.name.trim()) ||
        (me.cuit && me.cuit.trim())
    )
  }, [me])

  const formLooksEmpty = useMemo(() => {
    return !shippingData.phone.trim() && !shippingData.cuit.trim()
  }, [shippingData])

  const applySavedData = () => {
    if (!me) return
    setShippingData((prev) => ({
      ...prev,
      name: me.name ?? prev.name,
      email: me.email ?? prev.email,
      phone: me.phone ?? prev.phone,
      cuit: me.cuit ?? prev.cuit,
    }))
    setShowUseSavedPrompt(false)
  }

  useEffect(() => {
    // Traer "mis datos" para poder ofrecer autocompletar en checkout
    let cancelled = false
    ;(async () => {
      const res = await fetch('/api/me', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return
      if (cancelled) return
      setMe((data?.user ?? null) as Me | null)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    // Mostrar sugerencia solo si hay datos guardados y el formulario está vacío.
    if (hasSavedShipping && formLooksEmpty) {
      setShowUseSavedPrompt(true)
    }
  }, [hasSavedShipping, formLooksEmpty])

  const payWithMercadoPago = async () => {
    try {
      if (items.length === 0) {
        toast.error('Tu carrito está vacío.')
        return
      }

      const name = shippingData.name.trim()
      const email = shippingData.email.trim()
      const phone = shippingData.phone.trim()
      const cuit = shippingData.cuit.trim()
      if (name.length < 2) {
        toast.error('Completá tu nombre.')
        return
      }
      if (!email || !email.includes('@')) {
        toast.error('Completá un email válido.')
        return
      }
      if (phone.length < 3) {
        toast.error('Completá tu teléfono.')
        return
      }
      if (me?.customerType === 'WHOLESALE' && !cuit) {
        toast.error('Completá tu CUIT.')
        return
      }

      setIsProcessing(true)

      // Crear preferencia de Mercado Pago
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          shipping: shippingData,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al crear la preferencia de pago')
      }

      const data = await response.json()

      // Redirigir a Mercado Pago
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        throw new Error('No se recibió el link de pago')
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Error al procesar el pago. Por favor intenta de nuevo.')
      setIsProcessing(false)
    }
  }

  const payAtFactory = async () => {
    try {
      if (items.length === 0) {
        toast.error('Tu carrito está vacío.')
        return
      }

      const name = shippingData.name.trim()
      const email = shippingData.email.trim()
      const phone = shippingData.phone.trim()
      const cuit = shippingData.cuit.trim()
      if (name.length < 2) {
        toast.error('Completá tu nombre.')
        return
      }
      if (!email || !email.includes('@')) {
        toast.error('Completá un email válido.')
        return
      }
      if (phone.length < 3) {
        toast.error('Completá tu teléfono.')
        return
      }
      // Pagar en fábrica solo aplica a mayoristas aprobados; pedimos CUIT también.
      if (!cuit) {
        toast.error('Completá tu CUIT.')
        return
      }

      setIsProcessing(true)

      const response = await fetch('/api/orders/pay-at-factory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
          shipping: shippingData,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          data?.error ||
            'No se pudo crear el pedido. Revisá los datos del formulario e intentá de nuevo.'
        )
      }

      clearCart({ silent: true })
      window.location.href = `/checkout/pending?order_id=${encodeURIComponent(data.order_id)}`
    } catch (e: any) {
      toast.error(e?.message ?? 'Error')
      setIsProcessing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Formulario de envío */}
      <div className="lg:col-span-2">
        {showUseSavedPrompt && hasSavedShipping ? (
          <div className="mb-4 border border-gray-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                ¿Querés completar con tus datos guardados?
              </p>
              <p className="text-xs text-gray-600">
                Podés editarlos igual antes de pagar.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowUseSavedPrompt(false)}
                className="px-4 py-2 border border-gray-200 text-gray-800 hover:border-black transition"
              >
                No
              </button>
              <button
                type="button"
                onClick={applySavedData}
                className="px-4 py-2 bg-black text-white border-2 border-black hover:bg-gray-900 transition"
              >
                Sí, usar mis datos
              </button>
            </div>
          </div>
        ) : null}

        <form onSubmit={(e) => { e.preventDefault() }} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Datos de contacto y entrega</h2>

          {hasSavedShipping ? (
            <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-700">
                Si ya cargaste “Mis datos”, podés autocompletar el formulario.
              </p>
              <button
                type="button"
                onClick={() => {
                  applySavedData()
                  toast.success('Datos cargados desde tu perfil')
                }}
                className="shrink-0 text-xs font-semibold text-black underline hover:text-gray-700"
              >
                Cargar mis datos
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={shippingData.name}
                onChange={(e) => setShippingData({ ...shippingData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={shippingData.email}
                onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                required
                value={shippingData.phone}
                onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CUIT
              </label>
              <input
                type="text"
                required={me?.customerType === 'WHOLESALE'}
                value={shippingData.cuit}
                onChange={(e) => setShippingData({ ...shippingData, cuit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ej: 20-12345678-9"
              />
              {me?.customerType === 'WHOLESALE' ? (
                <p className="text-xs text-gray-500 mt-1">
                  Requerido para mayoristas.
                </p>
              ) : null}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Entrega</h3>
            <p className="text-sm text-gray-600 mb-4">
              Elegí cómo querés recibir tu pedido. El costo de envío (si corresponde) se coordina luego de la compra.
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-black transition">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="PICKUP_FACTORY"
                  checked={shippingData.deliveryMethod === 'PICKUP_FACTORY'}
                  onChange={() =>
                    setShippingData((prev) => ({ ...prev, deliveryMethod: 'PICKUP_FACTORY' }))
                  }
                  className="mt-1"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">Retirar gratis en fábrica</p>
                  <p className="text-sm text-gray-600">
                    Retiro sin costo. Dirección:
                    <span className="font-medium"> {factoryAddressLine1}</span>, {factoryAddressLine2}.
                  </p>
                  <a
                    href={factoryGoogleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-black underline hover:text-gray-700"
                  >
                    Ver en Google Maps
                  </a>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-black transition">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="AGREE_WITH_COMPANY"
                  checked={shippingData.deliveryMethod === 'AGREE_WITH_COMPANY'}
                  onChange={() =>
                    setShippingData((prev) => ({ ...prev, deliveryMethod: 'AGREE_WITH_COMPANY' }))
                  }
                  className="mt-1"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">Acordar envío con la empresa</p>
                  <p className="text-sm text-gray-600">
                    El envío tiene costo a cargo del cliente. Después de pagar vas a poder tocar “Acordar envío” para
                    coordinar por WhatsApp con COP.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={payWithMercadoPago}
              disabled={isProcessing}
              className="w-full bg-orange-500 text-white py-3 border border-orange-500 font-semibold hover:bg-orange-600 hover:border-orange-600 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-5 h-5" />
              <span>{isProcessing ? 'Procesando...' : 'Pagar con Mercado Pago'}</span>
            </button>

            {canPayAtFactory ? (
              <button
                type="button"
                onClick={payAtFactory}
                disabled={isProcessing}
                className="w-full bg-black text-white py-3 border-2 border-black font-semibold hover:bg-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Procesando...' : 'Pagar en fábrica'}
              </button>
            ) : null}
          </div>
        </form>
      </div>

      {/* Resumen del pedido */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen del Pedido</h2>

          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.name} x {item.quantity}
                </span>
                <span className="text-gray-900 font-semibold">
                  ${(item.price * item.quantity).toLocaleString('es-MX')}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold">${total.toLocaleString('es-MX')}</span>
              </div>
              {discountInfo.percent > 0 ? (
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Descuento ({discountInfo.percent}%)</span>
                  <span className="font-semibold">-${discountInfo.discountAmount.toLocaleString('es-MX')}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>${discountInfo.discountedTotal.toLocaleString('es-MX')}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {shippingData.deliveryMethod === 'PICKUP_FACTORY'
                ? 'Entrega: retiro gratis en fábrica'
                : 'Entrega: envío a coordinar (costo a cargo del cliente)'}
            </p>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Nota:</strong> Serás redirigido a Mercado Pago para completar el pago de forma segura.
            </p>
          </div>

          {canPayAtFactory ? (
            <div className="p-3 bg-gray-50 rounded-lg mt-3 border border-gray-200">
              <p className="text-xs text-gray-800">
                <strong>Mayorista:</strong> también podés elegir “Pagar en fábrica / otros medios”. El pedido queda
                pendiente hasta confirmación de COP y la coordinación por WhatsApp es obligatoria.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

