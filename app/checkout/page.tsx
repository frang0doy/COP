'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CheckoutForm from '@/components/checkout/CheckoutForm'

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, clearCart } = useCart()
  const [showLeavePrompt, setShowLeavePrompt] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/checkout')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session || items.length === 0) {
    return null
  }

  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {showLeavePrompt ? (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowLeavePrompt(false)}
            />
            <div className="absolute right-4 top-24 w-[min(92vw,460px)]">
              <div className="bg-white border border-gray-200 shadow-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900">¿Querés salir del checkout?</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Podés borrar el carrito o dejarlo guardado para más tarde.
                </p>
                <div className="mt-5 flex gap-3 justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-200 text-gray-800 hover:border-black transition"
                    onClick={() => {
                      setShowLeavePrompt(false)
                      router.push('/carrito')
                    }}
                  >
                    Dejar guardado
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-black text-white border-2 border-black hover:bg-gray-900 transition"
                    onClick={() => {
                      clearCart({ silent: true })
                      setShowLeavePrompt(false)
                      router.push('/carrito')
                    }}
                  >
                    Borrar carrito
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Compra</h1>
          <button
            type="button"
            onClick={() => setShowLeavePrompt(true)}
            className="px-4 py-2 border border-gray-300 bg-white hover:border-black transition font-semibold"
          >
            Volver al carrito
          </button>
        </div>
        <CheckoutForm />
      </div>
      <Footer />
    </main>
  )
}

