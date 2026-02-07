'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

type OrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
type PaymentMethod = 'MERCADOPAGO' | 'PAY_AT_FACTORY'

type OrderRow = {
  id: string
  number?: number | null
  createdAt: string
  total: number
  status: OrderStatus
  paymentMethod?: PaymentMethod
  userEmail?: string | null
  shipping?: any
  items: Array<{ id: string; name: string; quantity: number; unitPrice: number }>
}

export default function AdminPedidosPage() {
  const { data: session, status } = useSession()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [onlyPendingFactory, setOnlyPendingFactory] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (status !== 'authenticated') return
    let cancelled = false
    ;(async () => {
      const res = await fetch('/api/me', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (cancelled) return
      setIsAdmin(data?.user?.role === 'ADMIN')
    })()
    return () => {
      cancelled = true
    }
  }, [status])

  const load = async () => {
    const res = await fetch('/api/admin/orders', { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar pedidos')
    setOrders((data?.orders ?? []) as OrderRow[])
  }

  useEffect(() => {
    if (status !== 'authenticated') return
    if (isAdmin === false || isAdmin === null) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        await load()
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message ?? 'Error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [status, isAdmin])

  const filtered = useMemo(() => {
    let list = orders
    if (onlyPendingFactory) {
      list = list.filter((o) => o.status === 'PENDING' && o.paymentMethod === 'PAY_AT_FACTORY')
    }
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (o) =>
        (o.userEmail || '').toLowerCase().includes(q) ||
        String(o.number ?? '').includes(q) ||
        o.id.toLowerCase().includes(q)
    )
  }, [orders, onlyPendingFactory, query])

  const confirm = async (id: string) => {
    const res = await fetch(`/api/admin/orders/${id}/confirm`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'No se pudo confirmar')
    setOrders((prev) => prev.map((o) => (o.id === id ? (data.order as OrderRow) : o)))
  }

  const reject = async (id: string) => {
    const res = await fetch(`/api/admin/orders/${id}/reject`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'No se pudo rechazar')
    setOrders((prev) => prev.map((o) => (o.id === id ? (data.order as OrderRow) : o)))
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!session) return null

  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin · Pedidos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Confirmación manual de pedidos pendientes (pagar en fábrica).
          </p>
        </div>

        {isAdmin === false ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-red-600 font-semibold">No autorizado</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={onlyPendingFactory}
                  onChange={(e) => setOnlyPendingFactory(e.target.checked)}
                />
                Ver solo pendientes “Pagar en fábrica”
              </label>

              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por email, número o ID..."
                  className="w-full sm:w-80 px-3 py-2 border border-gray-300"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true)
                      await load()
                      toast.success('Actualizado')
                    } catch (e: any) {
                      toast.error(e?.message ?? 'Error')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="px-4 py-2 bg-orange-500 text-white border border-orange-500 hover:bg-orange-600 hover:border-orange-600 transition-colors duration-200"
                >
                  Refrescar
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-gray-600">Cargando pedidos...</p>
            ) : filtered.length === 0 ? (
              <p className="text-gray-600">No hay pedidos para mostrar.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">Pedido</th>
                      <th className="py-2 pr-4">Cliente</th>
                      <th className="py-2 pr-4">Método</th>
                      <th className="py-2 pr-4">Estado</th>
                      <th className="py-2 pr-4">Total</th>
                      <th className="py-2 pr-0 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o) => (
                      <tr key={o.id} className="border-b last:border-b-0 align-top">
                        <td className="py-2 pr-4">
                          <div className="font-semibold text-gray-900">
                            #{o.number ?? o.id}
                          </div>
                          <div className="text-xs text-gray-600">
                            {new Date(o.createdAt).toLocaleString('es-MX')}
                          </div>
                        </td>
                        <td className="py-2 pr-4">
                          <div className="text-gray-900">{o.userEmail || o?.shipping?.email || '—'}</div>
                          <div className="text-xs text-gray-600">
                            {o?.shipping?.cuit ? `CUIT: ${o.shipping.cuit}` : ''}
                          </div>
                        </td>
                        <td className="py-2 pr-4">
                          {o.paymentMethod === 'PAY_AT_FACTORY'
                            ? 'Pagar en fábrica'
                            : 'MercadoPago'}
                        </td>
                        <td className="py-2 pr-4">{o.status}</td>
                        <td className="py-2 pr-4 font-semibold">
                          ${o.total.toLocaleString('es-MX')}
                        </td>
                        <td className="py-2 pr-0">
                          <div className="flex items-center gap-2 justify-end">
                            {o.status === 'PENDING' && o.paymentMethod === 'PAY_AT_FACTORY' ? (
                              <>
                                <button
                                  type="button"
                                  className="px-3 py-2 bg-black text-white border-2 border-black hover:bg-gray-900 transition"
                                  onClick={async () => {
                                    try {
                                      await confirm(o.id)
                                      toast.success('Pedido confirmado (stock descontado)')
                                    } catch (e: any) {
                                      toast.error(e?.message ?? 'Error')
                                    }
                                  }}
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  className="px-3 py-2 border border-gray-300 bg-white hover:border-black transition"
                                  onClick={async () => {
                                    try {
                                      await reject(o.id)
                                      toast.success('Pedido rechazado')
                                    } catch (e: any) {
                                      toast.error(e?.message ?? 'Error')
                                    }
                                  }}
                                >
                                  Rechazar
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}

