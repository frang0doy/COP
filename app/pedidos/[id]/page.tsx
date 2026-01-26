'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

type OrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

type OrderItem = {
  id: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

type Order = {
  id: string
  number: number
  createdAt: string
  total: number
  status: OrderStatus
  mpPaymentId?: string | null
  mpPreferenceId?: string | null
  shipping?: any
  items: OrderItem[]
}

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
}

export default function PedidoDetallePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const res = await fetch(`/api/orders/${params.id}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) throw new Error(data?.error || 'No se pudo cargar el pedido')
        setOrder((data?.order ?? null) as Order | null)
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message ?? 'Error')
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [status, params.id])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Detalle de pedido</h1>
          <Link href="/pedidos" className="text-sm font-semibold underline hover:text-gray-700">
            Volver a mis pedidos
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600">Cargando pedido...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        ) : order ? (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div>
              <p className="text-sm text-gray-600">
                Pedido <span className="font-semibold text-gray-900">#{order.number}</span>
              </p>
              <p className="text-xs text-gray-500">ID: {order.id}</p>
              <p className="text-sm text-gray-600 mt-2">
                Estado: <span className="font-semibold">{statusLabels[order.status]}</span>
              </p>
            </div>

            <div className="border-t pt-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Productos</h2>
              <ul className="space-y-2">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="text-gray-900 font-semibold">
                      ${(item.subtotal ?? item.unitPrice * item.quantity).toLocaleString('es-MX')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-bold text-gray-900">
                ${order.total.toLocaleString('es-MX')}
              </span>
            </div>

            <div className="border-t pt-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Pago</h2>
              <div className="text-xs text-gray-600 space-y-1">
                {order.mpPaymentId ? <p>Payment ID: {order.mpPaymentId}</p> : <p>Payment ID: -</p>}
                {order.mpPreferenceId ? (
                  <p>Preference ID: {order.mpPreferenceId}</p>
                ) : (
                  <p>Preference ID: -</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600">Pedido no encontrado.</p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}

