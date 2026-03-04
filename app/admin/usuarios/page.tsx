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
  wholesaleDiscountPercent?: number | null
  createdAt: string
}

function WholesaleBadge({
  customerType,
  wholesaleStatus,
  wholesaleTier,
  wholesaleDiscountPercent,
}: {
  customerType?: UserRow['customerType']
  wholesaleStatus?: UserRow['wholesaleStatus']
  wholesaleTier?: UserRow['wholesaleTier']
  wholesaleDiscountPercent?: UserRow['wholesaleDiscountPercent']
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

  const percentLabel =
    typeof wholesaleDiscountPercent === 'number' && Number.isFinite(wholesaleDiscountPercent)
      ? `${Math.max(0, Math.floor(wholesaleDiscountPercent))}%`
      : null

  const tierLabel =
    wholesaleTier === 'HISTORICAL'
      ? `Histórico${percentLabel ? ` (${percentLabel})` : ''}`
      : wholesaleTier === 'NEW'
        ? `Nuevo${percentLabel ? ` (${percentLabel})` : ''}`
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
  const [query, setQuery] = useState('')
  const [customerFilter, setCustomerFilter] = useState<'ALL' | 'RETAIL' | 'WHOLESALE'>('ALL')
  const [tierFilter, setTierFilter] = useState<'ALL' | 'NEW' | 'HISTORICAL'>('ALL')
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'AR' | 'MX' | 'CU'>('ALL')
  const [sortKey, setSortKey] = useState<'createdAt' | 'email' | 'cuit' | 'wholesaleDiscountPercent'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 25

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
    const res = await fetch(`/api/admin/users`, { cache: 'no-store' })
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
  }, [status, isAdmin])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = users
      .filter((u) => {
        if (customerFilter !== 'ALL' && u.customerType !== customerFilter) return false
        if (tierFilter !== 'ALL') {
          if (u.customerType !== 'WHOLESALE') return false
          if (u.wholesaleTier !== tierFilter) return false
        }
        if (countryFilter !== 'ALL' && (u.country ?? null) !== countryFilter) return false
        if (!q) return true
        return (
          (u.email || '').toLowerCase().includes(q) ||
          (u.name || '').toLowerCase().includes(q) ||
          (u.cuit || '').toLowerCase().includes(q)
        )
      })
      .slice()

    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'createdAt') {
        const aa = new Date(a.createdAt).getTime() || 0
        const bb = new Date(b.createdAt).getTime() || 0
        return (aa - bb) * dir
      }
      if (sortKey === 'wholesaleDiscountPercent') {
        const aa = Number(a.wholesaleDiscountPercent ?? -1)
        const bb = Number(b.wholesaleDiscountPercent ?? -1)
        return (aa - bb) * dir
      }
      return String((a as any)[sortKey] ?? '').localeCompare(String((b as any)[sortKey] ?? ''), 'es', { sensitivity: 'base' }) * dir
    })

    return list
  }, [users, query, customerFilter, tierFilter, countryFilter, sortKey, sortDir])

  useEffect(() => {
    setPage(1)
  }, [query, customerFilter, tierFilter, countryFilter, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(pageCount, Math.max(1, page))
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage])

  const [discountDraft, setDiscountDraft] = useState<Record<string, string>>({})

  useEffect(() => {
    // Mantener drafts alineados con el listado visible (sin pisar si el usuario ya tipeó).
    setDiscountDraft((prev) => {
      let changed = false
      const next = { ...prev }
      for (const u of users) {
        if (next[u.id] !== undefined) continue
        const v =
          typeof u.wholesaleDiscountPercent === 'number' && Number.isFinite(u.wholesaleDiscountPercent)
            ? String(Math.max(0, Math.floor(u.wholesaleDiscountPercent)))
            : ''
        next[u.id] = v
        changed = true
      }
      return changed ? next : prev
    })
  }, [users])

  const saveDiscount = async (u: UserRow) => {
    const raw = (discountDraft[u.id] ?? '').trim()
    const discountPercent = raw === '' ? null : Math.min(100, Math.max(0, Math.floor(Number(raw))))
    if (raw !== '' && !Number.isFinite(Number(raw))) {
      toast.error('Descuento inválido')
      return
    }
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_discount', discountPercent }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'No se pudo guardar')
    setUsers((prev) => prev.map((x) => (x.id === u.id ? (data.user as UserRow) : x)))
    toast.success('Descuento actualizado')
  }

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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin · Usuarios</h1>
            <p className="text-sm text-gray-600 mt-1">
              Registro de usuarios creados en la web (minoristas y mayoristas).
            </p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 w-full">
                <div className="lg:col-span-2">
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
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo</label>
                  <select
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                  >
                    <option value="ALL">Todos</option>
                    <option value="RETAIL">Minorista</option>
                    <option value="WHOLESALE">Mayorista</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tier</label>
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                  >
                    <option value="ALL">Todos</option>
                    <option value="NEW">Nuevo</option>
                    <option value="HISTORICAL">Histórico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">País</label>
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                  >
                    <option value="ALL">Todos</option>
                    <option value="AR">AR</option>
                    <option value="MX">MX</option>
                    <option value="CU">CU</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Orden</label>
                  <div className="flex gap-2">
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                    >
                      <option value="createdAt">Alta</option>
                      <option value="email">Email</option>
                      <option value="cuit">CUIT</option>
                      <option value="wholesaleDiscountPercent">% mayorista</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                      className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 hover:border-orange-300 hover:text-orange-800 transition font-semibold"
                    >
                      {sortDir === 'asc' ? 'Asc' : 'Desc'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  if (filtered.length === 0) {
                    toast.error('No hay usuarios para exportar')
                    return
                  }
                  downloadCsv(
                    `usuarios_${new Date().toISOString().slice(0, 10)}.csv`,
                    filtered.map((u) => ({
                      id: u.id,
                      email: u.email,
                      name: u.name ?? '',
                      customerType: u.customerType ?? '',
                      cuit: u.cuit ?? '',
                      country: u.country ?? '',
                      wholesaleStatus: u.wholesaleStatus ?? '',
                      wholesaleTier: u.wholesaleTier ?? '',
                      wholesaleDiscountPercent: u.wholesaleDiscountPercent ?? '',
                      createdAt: u.createdAt,
                    }))
                  )
                }}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 hover:border-orange-300 hover:text-orange-800 transition font-semibold"
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
                className="px-4 py-2 rounded-xl border border-orange-200 bg-orange-50/70 text-orange-800 font-semibold hover:bg-orange-50 hover:border-orange-300 transition disabled:opacity-50"
              >
                Refrescar
              </button>
            </div>

            {loading ? (
              <p className="text-gray-600">Cargando usuarios...</p>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <p className="text-gray-900 font-semibold">No hay usuarios para mostrar.</p>
                <p className="text-sm text-gray-600 mt-1">
                  Buscá por email, nombre o CUIT.
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
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">% desc.</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">Alta</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {pageItems.map((u) => (
                      <tr key={u.id} className="border-b last:border-b-0 border-gray-100 align-top hover:bg-orange-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{u.name || '—'}</div>
                          <div className="text-xs text-gray-600">{u.email}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-semibold text-gray-800">
                              {u.customerType === 'WHOLESALE' ? 'Mayorista' : 'Minorista'}
                            </span>
                            {u.country ? <span className="text-gray-500"> · {u.country}</span> : null}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-800">{u.cuit || '—'}</td>
                        <td className="py-3 px-4">
                          <WholesaleBadge
                            customerType={u.customerType}
                            wholesaleStatus={u.wholesaleStatus}
                            wholesaleTier={u.wholesaleTier}
                            wholesaleDiscountPercent={u.wholesaleDiscountPercent}
                          />
                        </td>
                        <td className="py-3 px-4">
                          {u.customerType === 'WHOLESALE' ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={discountDraft[u.id] ?? ''}
                                onChange={(e) => setDiscountDraft((prev) => ({ ...prev, [u.id]: e.target.value }))}
                                inputMode="numeric"
                                placeholder="—"
                                className="w-20 px-2.5 py-2 border border-gray-200 rounded-lg focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await saveDiscount(u)
                                  } catch (e: any) {
                                    toast.error(e?.message ?? 'Error')
                                  }
                                }}
                                className="px-3 py-2 rounded-lg bg-black text-white border-2 border-black hover:border-orange-500 hover:bg-gray-900 transition font-semibold text-xs"
                              >
                                Guardar
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {new Date(u.createdAt).toLocaleDateString('es-MX')}
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
                  <span className="font-semibold text-gray-900">{filtered.length}</span> usuarios.
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

