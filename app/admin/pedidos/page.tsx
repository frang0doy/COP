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

function StatusBadge({ status }: { status: OrderStatus }) {
  const cls =
    status === 'PENDING'
      ? 'border-orange-200 bg-orange-50 text-orange-800'
      : status === 'APPROVED'
        ? 'border-green-200 bg-green-50 text-green-800'
        : status === 'REJECTED'
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-gray-200 bg-gray-50 text-gray-700'
  const label =
    status === 'PENDING'
      ? 'Pendiente'
      : status === 'APPROVED'
        ? 'Aprobado'
        : status === 'REJECTED'
          ? 'Rechazado'
          : 'Cancelado'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
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

  const pendingFactoryCount = orders.filter(
    (o) => o.status === 'PENDING' && o.paymentMethod === 'PAY_AT_FACTORY'
  ).length

  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin · Pedidos</h1>
            <p className="text-sm text-gray-600 mt-1">
              Confirmación manual de pedidos pendientes (pagar en fábrica).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-800">
              Pendientes (fábrica): <span className="font-semibold">{pendingFactoryCount}</span>
            </span>
          </div>
        </div>

        {isAdmin === false ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-1 rounded-full bg-orange-500/70" />
              <div>
                <p className="text-gray-900 font-bold">No autorizado</p>
                <p className="text-sm text-gray-600 mt-1">
                  Este panel es solo para administradores.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={onlyPendingFactory}
                  onChange={(e) => setOnlyPendingFactory(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <span className="select-none">Ver solo pendientes “Pagar en fábrica”</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="w-full sm:w-80">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Buscar
                  </label>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Email, número o ID…"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                  />
                </div>
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
                  className="h-10 sm:mt-6 px-4 py-2 rounded-xl border border-orange-200 bg-orange-50/70 text-orange-800 font-semibold hover:bg-orange-50 hover:border-orange-300 transition disabled:opacity-50"
                >
                  Refrescar
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-gray-600">Cargando pedidos...</p>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <p className="text-gray-900 font-semibold">No hay pedidos para mostrar.</p>
                <p className="text-sm text-gray-600 mt-1">
                  Probá desactivar el filtro de “solo pendientes” o buscá por email/ID.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left border-b border-gray-200">
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">Pedido</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">Cliente</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">Método</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">Estado</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">Total</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filtered.map((o) => (
                      <tr key={o.id} className="border-b last:border-b-0 border-gray-100 align-top hover:bg-orange-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">
                            #{o.number ?? o.id}
                          </div>
                          <div className="text-xs text-gray-600">
                            {new Date(o.createdAt).toLocaleString('es-MX')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-900">{o.userEmail || o?.shipping?.email || '—'}</div>
                          {o?.shipping?.cuit ? (
                            <div className="text-xs text-gray-600">
                              CUIT: <span className="font-semibold text-gray-800">{o.shipping.cuit}</span>
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-800">
                            {o.paymentMethod === 'PAY_AT_FACTORY' ? 'Pagar en fábrica' : 'Mercado Pago'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          ${o.total.toLocaleString('es-MX')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 justify-end">
                            {o.status === 'PENDING' && o.paymentMethod === 'PAY_AT_FACTORY' ? (
                              <>
                                <button
                                  type="button"
                                  className="px-3 py-2 rounded-lg bg-orange-600 text-white border border-orange-600 hover:bg-orange-700 hover:border-orange-700 transition focus:outline-none focus:ring-2 focus:ring-orange-200"
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
                                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 hover:border-orange-300 hover:text-orange-800 transition focus:outline-none focus:ring-2 focus:ring-orange-100"
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

