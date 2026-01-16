'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, Home } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/context/CartContext'
import { useEffect } from 'react'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment_id')
  const { clearCart } = useCart()

  useEffect(() => {
    if (!paymentId) return

    clearCart()
  }, [paymentId, clearCart])

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Pago Exitoso!
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Tu pedido ha sido procesado correctamente. Recibirás un email de confirmación en breve.
        </p>

        {paymentId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>ID de Pago:</strong> {paymentId}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/pedidos"
            className="inline-flex items-center justify-center space-x-2 bg-black text-white px-6 py-3 border-2 border-black hover:bg-gray-900 transition"
          >
            <Package className="w-5 h-5" />
            <span>Ver Mis Pedidos</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center space-x-2 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            <Home className="w-5 h-5" />
            <span>Volver al Inicio</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <Suspense fallback={
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-pulse">
              <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
            </div>
          </div>
        </div>
      }>
        <CheckoutSuccessContent />
      </Suspense>
      <Footer />
    </main>
  )
}

