'use client'

import Link from 'next/link'
import { Clock, ShoppingCart, Home } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function CheckoutPendingPage() {
  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 rounded-full p-4">
              <Clock className="w-16 h-16 text-yellow-700" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Pago pendiente</h1>
          <p className="text-lg text-gray-600 mb-6">
            Tu pago quedó pendiente de confirmación. Si se aprueba, vas a ver el estado actualizado en “Mis pedidos”.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/carrito"
              className="inline-flex items-center justify-center space-x-2 bg-black text-white px-6 py-3 border-2 border-black hover:bg-gray-900 transition"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Volver al carrito</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center space-x-2 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              <Home className="w-5 h-5" />
              <span>Volver al inicio</span>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

