'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useSession } from 'next-auth/react'
import { MapPin, Phone, Mail, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

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
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          userId: session?.user?.email,
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
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Datos de Envío</h2>

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
            className="w-full bg-black text-white py-3 border-2 border-black font-semibold hover:bg-gray-900 transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

