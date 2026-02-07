'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

type UserRow = {
  id: string
  email: string
  name?: string | null
  cuit?: string | null
  country?: 'AR' | 'MX' | 'CU' | null
  customerType?: 'RETAIL' | 'WHOLESALE' | null
  wholesaleStatus?: 'PENDING' | 'APPROVED' | null
  wholesaleTier?: 'NEW' | 'HISTORICAL' | null
  createdAt: string
}

function WholesaleBadge({
  customerType,
  wholesaleStatus,
  wholesaleTier,
}: {
  customerType?: UserRow['customerType']
  wholesaleStatus?: UserRow['wholesaleStatus']
  wholesaleTier?: UserRow['wholesaleTier']
}) {
  if (customerType !== 'WHOLESALE') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700 text-xs font-semibold">
        Minorista
      </span>
    )
  }

  const statusCls =
    wholesaleStatus === 'APPROVED'
      ? 'border-green-200 bg-green-50 text-green-800'
      : 'border-orange-200 bg-orange-50 text-orange-800'
  const statusLabel = wholesaleStatus === 'APPROVED' ? 'Aprobado' : 'Pendiente'

  const tierLabel =
    wholesaleTier === 'HISTORICAL'
      ? 'Histórico (15%)'
      : wholesaleTier === 'NEW'
        ? 'Nuevo (10%)'
        : 'Mayorista'

  return (
    <div className="flex flex-wrap gap-2">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${statusCls}`}>
        {statusLabel}
      </span>
      <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-800">
        {tierLabel}
      </span>
    </div>
  )
}

export default function AdminUsuariosPage() {
  const { data: session, status } = useSession()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserRow[]>([])
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'ALL'>('PENDING')
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
    const qs =
      filter === 'ALL' ? '' : `?wholesaleStatus=${encodeURIComponent(filter)}`
    const res = await fetch(`/api/admin/users${qs}`, { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar usuarios')
    setUsers((data?.users ?? []) as UserRow[])
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
  }, [status, isAdmin, filter])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        (u.email || '').toLowerCase().includes(q) ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.cuit || '').toLowerCase().includes(q)
    )
  }, [users, query])

  const patch = async (id: string, body: any) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar')
    setUsers((prev) => prev.map((u) => (u.id === id ? (data.user as UserRow) : u)))
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!session) return null

  const pendingCount = users.filter(
    (u) => u.customerType === 'WHOLESALE' && u.wholesaleStatus === 'PENDING'
  ).length

  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin · Usuarios</h1>
            <p className="text-sm text-gray-600 mt-1">Aprobación de cuentas mayoristas.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-800">
              Pendientes: <span className="font-semibold">{pendingCount}</span>
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
              <div className="flex flex-wrap gap-2">
                {(['PENDING', 'APPROVED', 'ALL'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={[
                      'px-3 py-2 rounded-xl border text-sm font-semibold transition',
                      filter === f
                        ? 'bg-orange-50 text-orange-800 border-orange-200 ring-1 ring-orange-500/10'
                        : 'bg-white text-gray-900 border-gray-200 hover:border-orange-300 hover:text-orange-800',
                    ].join(' ')}
                  >
                    {f === 'PENDING'
                      ? 'Pendientes'
                      : f === 'APPROVED'
                        ? 'Aprobados'
                        : 'Todos'}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="w-full sm:w-80">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Buscar
                  </label>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Email, nombre o CUIT…"
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
              <p className="text-gray-600">Cargando usuarios...</p>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <p className="text-gray-900 font-semibold">No hay usuarios para mostrar.</p>
                <p className="text-sm text-gray-600 mt-1">
                  Cambiá el filtro o buscá por email/CUIT.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left border-b border-gray-200">
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">Usuario</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">CUIT</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">Mayorista</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filtered.map((u) => (
                      <tr key={u.id} className="border-b last:border-b-0 border-gray-100 align-top hover:bg-orange-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{u.name || '—'}</div>
                          <div className="text-xs text-gray-600">{u.email}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-800">{u.cuit || '—'}</td>
                        <td className="py-3 px-4">
                          <WholesaleBadge
                            customerType={u.customerType}
                            wholesaleStatus={u.wholesaleStatus}
                            wholesaleTier={u.wholesaleTier}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 justify-end">
                            {u.customerType === 'WHOLESALE' && u.wholesaleStatus === 'PENDING' ? (
                              <>
                                <button
                                  type="button"
                                  className="px-3 py-2 rounded-lg bg-orange-600 text-white border border-orange-600 hover:bg-orange-700 hover:border-orange-700 transition focus:outline-none focus:ring-2 focus:ring-orange-200"
                                  onClick={async () => {
                                    try {
                                      await patch(u.id, { action: 'approve', tier: 'NEW' })
                                      toast.success('Aprobado como mayorista nuevo')
                                    } catch (e: any) {
                                      toast.error(e?.message ?? 'Error')
                                    }
                                  }}
                                >
                                  Aprobar nuevo
                                </button>
                                <button
                                  type="button"
                                  className="px-3 py-2 rounded-lg bg-orange-600 text-white border border-orange-600 hover:bg-orange-700 hover:border-orange-700 transition focus:outline-none focus:ring-2 focus:ring-orange-200"
                                  onClick={async () => {
                                    try {
                                      await patch(u.id, {
                                        action: 'approve',
                                        tier: 'HISTORICAL',
                                      })
                                      toast.success('Aprobado como mayorista histórico')
                                    } catch (e: any) {
                                      toast.error(e?.message ?? 'Error')
                                    }
                                  }}
                                >
                                  Aprobar histórico
                                </button>
                                <button
                                  type="button"
                                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 hover:border-orange-300 hover:text-orange-800 transition focus:outline-none focus:ring-2 focus:ring-orange-100"
                                  onClick={async () => {
                                    try {
                                      await patch(u.id, { action: 'reject' })
                                      toast.success('Solicitud rechazada')
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

