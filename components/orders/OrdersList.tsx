'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Package, Calendar, DollarSign, Truck } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  date: string
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: Array<{
    id: number
    name: string
    quantity: number
    price: number
  }>
  paymentId?: string
}

// Datos de ejemplo - en producción vendrán de una API/DB
const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    date: '2024-01-15',
    total: 3750,
    status: 'delivered',
    items: [
      { id: 1, name: 'Pintura Acrílica Premium', quantity: 2, price: 1250 },
      { id: 2, name: 'Revestimiento Texturado', quantity: 1, price: 1250 },
    ],
    paymentId: 'MP-123456789',
  },
  {
    id: 'ORD-002',
    date: '2024-01-20',
    total: 2150,
    status: 'shipped',
    items: [
      { id: 3, name: 'Impermeabilizante Elastómero', quantity: 1, price: 2150 },
    ],
    paymentId: 'MP-987654321',
  },
]

const statusLabels = {
  pending: 'Pendiente',
  processing: 'En Proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function OrdersList() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    // En producción, hacer fetch a la API
    // Por ahora usamos datos de ejemplo
    setOrders(mockOrders)
  }, [])

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
                Pedido #{order.id}
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(order.date).toLocaleDateString('es-MX')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>${order.total.toLocaleString('es-MX')}</span>
                </div>
                {order.paymentId && (
                  <div className="text-xs text-gray-500">
                    Pago: {order.paymentId}
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
                    ${(item.price * item.quantity).toLocaleString('es-MX')}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {order.status === 'shipped' && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2 text-sm text-primary-600">
                <Truck className="w-4 h-4" />
                <span>Tu pedido está en camino</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

