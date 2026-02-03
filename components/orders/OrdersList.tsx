'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Package, Calendar, DollarSign, Truck } from 'lucide-react'
import Link from 'next/link'

type OrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

interface Order {
  id: string
  number?: number | null
  createdAt: string
  total: number
  status: OrderStatus
  mpPaymentId?: string | null
  userEmail?: string | null
  shipping?: any
  items: Array<{
    id: string
    name: string
    quantity: number
    unitPrice: number
  }>
}

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
}

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

export default function OrdersList(props: { mode?: 'mine' | 'all' } = {}) {
  const mode = props.mode ?? 'mine'
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const res = await fetch(mode === 'all' ? '/api/admin/orders' : '/api/orders', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (cancelled) return
      setOrders((data?.orders ?? []) as Order[])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [session, mode])

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tus pedidos</p>
        <Link
          href="/auth/login"
          className="text-black hover:text-gray-600 transition-colors font-semibold"
        >
          Iniciar Sesión
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Cargando pedidos...</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No tienes pedidos aún</h2>
        <p className="text-gray-600 mb-6">Cuando realices una compra, aparecerá aquí</p>
        <Link
          href="/productos"
          className="inline-block bg-black text-white px-6 py-3 border-2 border-black hover:bg-gray-900 transition"
        >
          Explorar Productos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                <Link href={`/pedidos/${order.id}`} className="hover:underline">
                  Pedido #{order.number ?? order.id}
                </Link>
              </h3>
              {mode === 'all' ? (
                <p className="text-xs text-gray-500 mb-2">
                  Cliente: {order.userEmail || order?.shipping?.email || '—'}
                  {order?.shipping?.cuit ? ` · CUIT: ${order.shipping.cuit}` : ''}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(order.createdAt).toLocaleDateString('es-MX')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>${order.total.toLocaleString('es-MX')}</span>
                </div>
                {order.mpPaymentId && (
                  <div className="text-xs text-gray-500">
                    Pago: {order.mpPaymentId}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status]}`}
              >
                {statusLabels[order.status]}
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Productos:</h4>
            <ul className="space-y-2">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="text-gray-900 font-semibold">
                    ${(item.unitPrice * item.quantity).toLocaleString('es-MX')}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {order.status === 'APPROVED' && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2 text-sm text-primary-600">
                <Truck className="w-4 h-4" />
                <span>Tu pago fue aprobado</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

