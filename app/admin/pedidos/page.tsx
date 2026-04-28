'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'
import Link from 'next/link'

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

function extractQuoted(input: string) {
  const m = String(input || '').match(/"([^"]+)"/)
  return m ? m[1] : null
}

export default function AdminPedidosPage() {
  const { data: session, status } = useSession()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [onlyPendingFactory, setOnlyPendingFactory] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const pageSize = 25
  const [detailId, setDetailId] = useState<string | null>(null)
  const [confirmErrorById, setConfirmErrorById] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
    if (!onlyPendingFactory) {
      if (statusFilter !== 'ALL') list = list.filter((o) => o.status === statusFilter)
      if (methodFilter !== 'ALL') list = list.filter((o) => o.paymentMethod === methodFilter)
    }
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (o) =>
        (o.userEmail || '').toLowerCase().includes(q) ||
        String(o.number ?? '').includes(q) ||
        o.id.toLowerCase().includes(q)
    )
  }, [orders, onlyPendingFactory, query, statusFilter, methodFilter])

  useEffect(() => {
    setPage(1)
  }, [onlyPendingFactory, query, statusFilter, methodFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(pageCount, Math.max(1, page))
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage])

  const selected = useMemo(() => {
    if (!detailId) return null
    return orders.find((o) => o.id === detailId) ?? null
  }, [detailId, orders])

  const downloadCsv = (filename: string, rows: Array<Record<string, any>>) => {
    const headers = Object.keys(rows[0] || {})
    const esc = (v: any) => {
      const s = String(v ?? '')
      const needs = /[",\n]/.test(s)
      const out = s.replace(/"/g, '""')
      return needs ? `"${out}"` : out
    }
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const confirm = async (id: string) => {
    const res = await fetch(`/api/admin/orders/${id}/confirm`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'No se pudo confirmar')
    setOrders((prev) => prev.map((o) => (o.id === id ? (data.order as OrderRow) : o)))
    setConfirmErrorById((prev) => {
      if (!prev[id]) return prev
      const { [id]: _omit, ...rest } = prev
      return rest
    })
  }

  const reject = async (id: string) => {
    const res = await fetch(`/api/admin/orders/${id}/reject`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'No se pudo rechazar')
    setOrders((prev) => prev.map((o) => (o.id === id ? (data.order as OrderRow) : o)))
  }

  const removePendingMercadoPago = async (id: string) => {
    const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'No se pudo eliminar')
    setOrders((prev) => prev.filter((o) => o.id !== id))
    if (detailId === id) setDetailId(null)
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
  const pendingMercadoPagoCount = orders.filter(
    (o) => o.status === 'PENDING' && o.paymentMethod === 'MERCADOPAGO'
  ).length

  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      {selected ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailId(null)} />
          <div className="absolute right-4 top-24 w-[min(92vw,760px)]">
            <div className="bg-white border border-gray-200 shadow-2xl overflow-hidden">
              <div className="h-1 bg-orange-500" />
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.25em] text-gray-600 uppercase">
                      Detalle de pedido
                    </p>
                    <p className="text-xl font-extrabold text-gray-900 mt-1">
                      #{selected.number ?? selected.id}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(selected.createdAt).toLocaleString('es-MX')} ·{' '}
                      {selected.paymentMethod === 'PAY_AT_FACTORY' ? 'Pagar en fábrica' : 'Mercado Pago'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailId(null)}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 hover:border-orange-300 hover:text-orange-800 transition font-semibold"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <span className="text-sm font-semibold text-gray-900">
                    Total: ${selected.total.toLocaleString('es-MX')}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-900">Cliente</p>
                    <p className="text-sm text-gray-700 mt-1">
                      {selected.userEmail || selected?.shipping?.email || '—'}
                    </p>
                    {selected?.shipping?.cuit ? (
                      <p className="text-xs text-gray-600 mt-1">
                        CUIT: <span className="font-semibold text-gray-800">{selected.shipping.cuit}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-900">Envío</p>
                    <pre className="mt-2 text-xs text-gray-700 whitespace-pre-wrap break-words">
                      {JSON.stringify(selected.shipping ?? {}, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 text-xs font-bold tracking-wide text-gray-600 uppercase">
                    Ítems
                  </div>
                  <div className="px-4 py-3">
                    <ul className="space-y-2">
                      {selected.items.map((it) => (
                        <li key={it.id} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{it.name}</p>
                            <p className="text-xs text-gray-600">
                              {it.quantity} × ${it.unitPrice.toLocaleString('es-MX')}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            ${(it.quantity * it.unitPrice).toLocaleString('es-MX')}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
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
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={onlyPendingFactory}
                    onChange={(e) => setOnlyPendingFactory(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="select-none">Ver solo pendientes “Pagar en fábrica”</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOnlyPendingFactory(false)
                      setStatusFilter('PENDING')
                      setMethodFilter('MERCADOPAGO')
                    }}
                    className="px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50/70 text-orange-800 hover:bg-orange-50 hover:border-orange-300 transition text-xs font-semibold"
                  >
                    Ver pendientes Mercado Pago ({pendingMercadoPagoCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOnlyPendingFactory(false)
                      setStatusFilter('ALL')
                      setMethodFilter('ALL')
                    }}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:text-orange-800 transition text-xs font-semibold"
                  >
                    Ver todos
                  </button>
                </div>
                {!onlyPendingFactory ? (
                  <div className="flex flex-wrap items-end gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Estado</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                      >
                        <option value="ALL">Todos</option>
                        <option value="PENDING">Pendiente</option>
                        <option value="APPROVED">Aprobado</option>
                        <option value="REJECTED">Rechazado</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Método</label>
                      <select
                        value={methodFilter}
                        onChange={(e) => setMethodFilter(e.target.value as any)}
                        className="px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                      >
                        <option value="ALL">Todos</option>
                        <option value="MERCADOPAGO">Mercado Pago</option>
                        <option value="PAY_AT_FACTORY">Pagar en fábrica</option>
                      </select>
                    </div>
                  </div>
                ) : null}
              </div>

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
                    onClick={() => {
                      if (filtered.length === 0) {
                        toast.error('No hay pedidos para exportar')
                        return
                      }
                      downloadCsv(
                        `pedidos_${new Date().toISOString().slice(0, 10)}.csv`,
                        filtered.map((o) => ({
                          id: o.id,
                          number: o.number ?? '',
                          createdAt: o.createdAt,
                          status: o.status,
                          paymentMethod: o.paymentMethod ?? '',
                          total: o.total,
                          email: o.userEmail || o?.shipping?.email || '',
                          cuit: o?.shipping?.cuit || '',
                        }))
                      )
                    }}
                    className="h-10 sm:mt-6 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 font-semibold hover:border-orange-300 hover:text-orange-800 transition disabled:opacity-50"
                  >
                    Exportar CSV
                  </button>
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
                    {pageItems.map((o) => (
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
                            <button
                              type="button"
                              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 hover:border-orange-300 hover:text-orange-800 transition focus:outline-none focus:ring-2 focus:ring-orange-100"
                              onClick={() => setDetailId(o.id)}
                            >
                              Ver
                            </button>
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
                                      const msg = String(e?.message ?? 'No se pudo confirmar')
                                      setConfirmErrorById((prev) => ({ ...prev, [o.id]: msg }))
                                      if (msg.toLowerCase().includes('stock insuficiente')) {
                                        toast.error(`No se puede confirmar: ${msg}`)
                                      } else {
                                        toast.error(msg)
                                      }
                                    }
                                  }}
                                >
                                  Confirmar
                                </button>
                                {confirmErrorById[o.id] &&
                                confirmErrorById[o.id].toLowerCase().includes('stock insuficiente') ? (
                                  (() => {
                                    const productName = extractQuoted(confirmErrorById[o.id])
                                    return productName ? (
                                      <Link
                                        href={`/admin/productos?q=${encodeURIComponent(productName)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-2 rounded-lg border border-orange-200 bg-orange-50/70 text-orange-800 hover:bg-orange-50 hover:border-orange-300 transition font-semibold"
                                        title="Abrir Admin productos para actualizar stock"
                                      >
                                        Actualizar stock
                                      </Link>
                                    ) : null
                                  })()
                                ) : null}
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
                            ) : o.status === 'PENDING' && o.paymentMethod === 'MERCADOPAGO' ? (
                              <button
                                type="button"
                                disabled={deletingId === o.id}
                                className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 transition focus:outline-none focus:ring-2 focus:ring-red-100 disabled:opacity-60"
                                onClick={async () => {
                                  const ok = window.confirm(
                                    `¿Eliminar el pedido #${o.number ?? o.id}? Esta acción no se puede deshacer.`
                                  )
                                  if (!ok) return
                                  try {
                                    setDeletingId(o.id)
                                    await removePendingMercadoPago(o.id)
                                    toast.success('Pedido eliminado')
                                  } catch (e: any) {
                                    toast.error(e?.message ?? 'Error')
                                  } finally {
                                    setDeletingId((current) => (current === o.id ? null : current))
                                  }
                                }}
                              >
                                {deletingId === o.id ? 'Eliminando...' : 'Eliminar pedido'}
                              </button>
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

            {!loading ? (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs text-gray-600">
                  Mostrando <span className="font-semibold text-gray-900">{pageItems.length}</span> de{' '}
                  <span className="font-semibold text-gray-900">{filtered.length}</span> pedidos.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 hover:border-orange-300 hover:text-orange-800 transition font-semibold disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700">
                    Página <span className="font-semibold">{safePage}</span> /{' '}
                    <span className="font-semibold">{pageCount}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={safePage >= pageCount}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 hover:border-orange-300 hover:text-orange-800 transition font-semibold disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}

