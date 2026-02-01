'use client'

import { useEffect, useMemo, useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useSession } from 'next-auth/react'
import { CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

type Me = {
  id: string
  email: string
  name?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
}

export default function CheckoutForm() {
  const { items, total, clearCart } = useCart()
  const { data: session } = useSession()
  const [shippingData, setShippingData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [me, setMe] = useState<Me | null>(null)
  const [showUseSavedPrompt, setShowUseSavedPrompt] = useState(false)

  const hasSavedShipping = useMemo(() => {
    if (!me) return false
    return Boolean(
      (me.phone && me.phone.trim()) ||
        (me.address && me.address.trim()) ||
        (me.city && me.city.trim()) ||
        (me.state && me.state.trim()) ||
        (me.zipCode && me.zipCode.trim())
    )
  }, [me])

  const formLooksEmpty = useMemo(() => {
    return (
      !shippingData.phone.trim() &&
      !shippingData.address.trim() &&
      !shippingData.city.trim() &&
      !shippingData.state.trim() &&
      !shippingData.zipCode.trim()
    )
  }, [shippingData])

  const applySavedData = () => {
    if (!me) return
    setShippingData((prev) => ({
      ...prev,
      name: me.name ?? prev.name,
      email: me.email ?? prev.email,
      phone: me.phone ?? prev.phone,
      address: me.address ?? prev.address,
      city: me.city ?? prev.city,
      state: me.state ?? prev.state,
      zipCode: me.zipCode ?? prev.zipCode,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
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
          userId: session?.user?.id,
          userEmail: session?.user?.email,
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

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Datos de Envío</h2>

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
                Código Postal
              </label>
              <input
                type="text"
                required
                value={shippingData.zipCode}
                onChange={(e) => setShippingData({ ...shippingData, zipCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <input
                type="text"
                required
                value={shippingData.state}
                onChange={(e) => setShippingData({ ...shippingData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                required
                value={shippingData.city}
                onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección Completa
            </label>
            <textarea
              required
              value={shippingData.address}
              onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-orange-500 text-white py-3 border border-orange-500 font-semibold hover:bg-orange-600 hover:border-orange-600 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-5 h-5" />
            <span>{isProcessing ? 'Procesando...' : 'Pagar con Mercado Pago'}</span>
          </button>
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
            <div className="flex justify-between text-xl font-bold text-gray-900 mb-2">
              <span>Total</span>
              <span>${total.toLocaleString('es-MX')}</span>
            </div>
            <p className="text-sm text-gray-500">El envío se calculará después</p>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Nota:</strong> Serás redirigido a Mercado Pago para completar el pago de forma segura.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

