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

  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin · Usuarios</h1>
          <p className="text-sm text-gray-600 mt-1">Aprobación de cuentas mayoristas.</p>
        </div>

        {isAdmin === false ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-red-600 font-semibold">No autorizado</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="flex flex-wrap gap-2">
                {(['PENDING', 'APPROVED', 'ALL'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={[
                      'px-3 py-2 border text-sm font-semibold transition',
                      filter === f
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-gray-200 hover:border-black',
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

              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por email, nombre o CUIT..."
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
              <p className="text-gray-600">Cargando usuarios...</p>
            ) : filtered.length === 0 ? (
              <p className="text-gray-600">No hay usuarios para mostrar.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">Usuario</th>
                      <th className="py-2 pr-4">CUIT</th>
                      <th className="py-2 pr-4">Estado</th>
                      <th className="py-2 pr-4">Tipo</th>
                      <th className="py-2 pr-0 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} className="border-b last:border-b-0 align-top">
                        <td className="py-2 pr-4">
                          <div className="font-semibold text-gray-900">{u.name || '—'}</div>
                          <div className="text-xs text-gray-600">{u.email}</div>
                        </td>
                        <td className="py-2 pr-4">{u.cuit || '—'}</td>
                        <td className="py-2 pr-4">
                          {u.customerType === 'WHOLESALE'
                            ? u.wholesaleStatus === 'APPROVED'
                              ? 'Aprobado'
                              : 'Pendiente'
                            : '—'}
                        </td>
                        <td className="py-2 pr-4">
                          {u.wholesaleTier === 'HISTORICAL'
                            ? 'Histórico (15%)'
                            : u.wholesaleTier === 'NEW'
                              ? 'Nuevo (10%)'
                              : u.customerType === 'WHOLESALE'
                                ? 'Mayorista'
                                : 'Minorista'}
                        </td>
                        <td className="py-2 pr-0">
                          <div className="flex items-center gap-2 justify-end">
                            {u.customerType === 'WHOLESALE' &&
                            u.wholesaleStatus === 'PENDING' ? (
                              <>
                                <button
                                  type="button"
                                  className="px-3 py-2 bg-black text-white border-2 border-black hover:bg-gray-900 transition"
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
                                  className="px-3 py-2 bg-black text-white border-2 border-black hover:bg-gray-900 transition"
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
                                  className="px-3 py-2 border border-gray-300 bg-white hover:border-black transition"
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

