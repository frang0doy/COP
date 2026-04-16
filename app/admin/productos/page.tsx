'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'
import { getAdminProductDisplayName } from '@/lib/admin-product-display-name'

type Product = {
  id: number
  sku: string
  name: string
  category: string
  price: number
  stock: number
  isNew?: boolean | null
  isActive?: boolean | null
}

type SortKey = 'id' | 'sku' | 'name' | 'category' | 'price' | 'stock' | 'isActive'

function downloadCsv(filename: string, rows: Array<Record<string, any>>) {
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

export default function AdminProductosPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('ALL')
  const [active, setActive] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL')
  const [stock, setStock] = useState<'ALL' | 'LOW' | 'OUT'>('ALL')
  const [isNew, setIsNew] = useState<'ALL' | 'YES' | 'NO'>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const pageSize = 25

  useEffect(() => {
    const q = (searchParams.get('q') || '').trim()
    if (!q) return
    setQuery((prev) => (prev.trim() ? prev : q))
  }, [searchParams])

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

  const loadProducts = async () => {
    const res = await fetch('/api/admin/products', { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar los productos')
    setProducts((data?.products ?? []) as Product[])
  }

  useEffect(() => {
    if (status !== 'authenticated') return
    if (isAdmin !== true) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        await loadProducts()
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

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) set.add(String(p.category || '').trim())
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b))
  }, [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = products
      .filter((p) => {
        if (category !== 'ALL' && p.category !== category) return false
        const act = p.isActive ?? true
        if (active === 'ACTIVE' && !act) return false
        if (active === 'PAUSED' && act) return false
        const st = Number(p.stock ?? 0)
        if (stock === 'LOW' && !(st > 0 && st <= 5)) return false
        if (stock === 'OUT' && st !== 0) return false
        const n = Boolean(p.isNew)
        if (isNew === 'YES' && !n) return false
        if (isNew === 'NO' && n) return false
        if (!q) return true
        const adminName = getAdminProductDisplayName(p).toLowerCase()
        return (
          String(p.id).includes(q) ||
          String(p.sku || '').toLowerCase().includes(q) ||
          String(p.name || '').toLowerCase().includes(q) ||
          adminName.includes(q) ||
          String(p.category || '').toLowerCase().includes(q)
        )
      })
      .slice()

    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'isActive') {
        const aa = (a.isActive ?? true) ? 1 : 0
        const bb = (b.isActive ?? true) ? 1 : 0
        return (aa - bb) * dir
      }
      if (sortKey === 'name') {
        return (
          getAdminProductDisplayName(a).localeCompare(getAdminProductDisplayName(b), 'es', {
            sensitivity: 'base',
          }) * dir
        )
      }
      const av = (a as any)[sortKey]
      const bv = (b as any)[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av ?? '').localeCompare(String(bv ?? ''), 'es', { sensitivity: 'base' }) * dir
    })

    return list
  }, [products, query, category, active, stock, isNew, sortKey, sortDir])

  useEffect(() => {
    setPage(1)
  }, [query, category, active, stock, isNew, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(pageCount, Math.max(1, page))
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage])

  const updateProduct = async (id: number, patch: Partial<Product>) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'No se pudo guardar')
    setProducts((prev) => prev.map((p) => (p.id === id ? (data.product as Product) : p)))
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }
  if (!session) return null

  const totalProducts = products.length
  const inactiveCount = products.filter((p) => !(p.isActive ?? true)).length
  const lowStockCount = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length

  return (
    <div className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin · Productos</h1>
            <p className="text-sm text-gray-600 mt-1">Editá stock/precio y pausá productos del catálogo.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-700">
              Total: <span className="font-semibold text-gray-900">{totalProducts}</span>
            </span>
            <span className="px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-800">
              Pausados: <span className="font-semibold">{inactiveCount}</span>
            </span>
            <span className="px-3 py-1 rounded-full border border-orange-200 bg-white text-gray-700">
              Stock bajo: <span className="font-semibold text-gray-900">{lowStockCount}</span>
            </span>
          </div>
        </div>

        {isAdmin === false ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-1 rounded-full bg-orange-500/70" />
              <div>
                <p className="text-gray-900 font-bold">No autorizado</p>
                <p className="text-sm text-gray-600 mt-1">Este panel es solo para administradores.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col gap-3 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <div className="w-full">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Buscar</label>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ID, SKU, nombre o categoría…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                  >
                    <option value="ALL">Todas</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado</label>
                  <select
                    value={active}
                    onChange={(e) => setActive(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                  >
                    <option value="ALL">Todos</option>
                    <option value="ACTIVE">Activos</option>
                    <option value="PAUSED">Pausados</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stock</label>
                  <select
                    value={stock}
                    onChange={(e) => setStock(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                  >
                    <option value="ALL">Todos</option>
                    <option value="LOW">Bajo (1–5)</option>
                    <option value="OUT">Sin stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nuevo</label>
                  <select
                    value={isNew}
                    onChange={(e) => setIsNew(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                  >
                    <option value="ALL">Todos</option>
                    <option value="YES">Sí</option>
                    <option value="NO">No</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Orden</label>
                  <div className="flex gap-2">
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as any)}
                      className="px-3 py-2 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                    >
                      <option value="id">ID</option>
                      <option value="sku">SKU</option>
                      <option value="name">Nombre</option>
                      <option value="category">Categoría</option>
                      <option value="price">Precio</option>
                      <option value="stock">Stock</option>
                      <option value="isActive">Activo</option>
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

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (filtered.length === 0) return toast.error('No hay productos para exportar')
                      downloadCsv(
                        `productos_${new Date().toISOString().slice(0, 10)}.csv`,
                        filtered.map((p) => ({
                          id: p.id,
                          sku: p.sku,
                          name: getAdminProductDisplayName(p),
                          category: p.category,
                          price: p.price,
                          stock: p.stock,
                          isActive: (p.isActive ?? true) ? '1' : '0',
                          isNew: p.isNew ? '1' : '0',
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
                        await loadProducts()
                        toast.success('Productos actualizados')
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
              </div>
            </div>

            {loading ? (
              <p className="text-gray-600">Cargando productos...</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left border-b border-gray-200">
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">ID</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">SKU</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">Nombre</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">Categoría</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">Precio</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase">Stock</th>
                      <th className="py-3 px-4 text-xs font-bold tracking-wide text-gray-600 uppercase text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {pageItems.map((p) => (
                      <AdminRow
                        key={p.id}
                        product={p}
                        adminDisplayName={getAdminProductDisplayName(p)}
                        onSave={updateProduct}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading ? (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs text-gray-600">
                  Mostrando <span className="font-semibold text-gray-900">{pageItems.length}</span> de{' '}
                  <span className="font-semibold text-gray-900">{filtered.length}</span> productos.
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
    </div>
  )
}

function AdminRow({
  product,
  adminDisplayName,
  onSave,
}: {
  product: Product
  adminDisplayName: string
  onSave: (id: number, patch: Partial<Product>) => Promise<void>
}) {
  const [price, setPrice] = useState(String(product.price))
  const [stock, setStock] = useState(String(product.stock))
  const [isActive, setIsActive] = useState(Boolean(product.isActive ?? true))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPrice(String(product.price))
    setStock(String(product.stock))
    setIsActive(Boolean(product.isActive ?? true))
  }, [product.price, product.stock, product.isActive])

  const dirty =
    Number(price) !== product.price ||
    Number(stock) !== product.stock ||
    Boolean(product.isActive ?? true) !== isActive

  return (
    <tr className="border-b last:border-b-0 border-gray-100 align-top hover:bg-orange-50/30 transition-colors">
      <td className="py-3 px-4 font-semibold text-gray-900">{product.id}</td>
      <td className="py-3 px-4 text-gray-800">{product.sku}</td>
      <td className="py-3 px-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-gray-900 font-medium">{adminDisplayName}</span>
          {adminDisplayName !== product.name ? (
            <span className="text-xs text-gray-500">Catálogo: {product.name}</span>
          ) : null}
          {isActive ? null : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
              PAUSADO
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-gray-700">{product.category}</td>
      <td className="py-3 px-4">
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-28 px-2.5 py-2 border border-gray-200 rounded-lg focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
          inputMode="numeric"
        />
      </td>
      <td className="py-3 px-4">
        <input
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-24 px-2.5 py-2 border border-gray-200 rounded-lg focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
          inputMode="numeric"
        />
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              try {
                setSaving(true)
                const next = !isActive
                await onSave(product.id, { isActive: next })
                setIsActive(next)
                toast.success(next ? 'Producto activado' : 'Producto pausado')
              } catch (e: any) {
                toast.error(e?.message ?? 'Error al guardar')
              } finally {
                setSaving(false)
              }
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 hover:border-orange-300 hover:text-orange-800 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-100"
            title={isActive ? 'Pausar (ocultar del catálogo)' : 'Activar (mostrar en catálogo)'}
          >
            {isActive ? 'Pausar' : 'Activar'}
          </button>
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={async () => {
              try {
                setSaving(true)
                await onSave(product.id, { price: Number(price), stock: Number(stock), isActive })
                toast.success('Guardado')
              } catch (e: any) {
                toast.error(e?.message ?? 'Error al guardar')
              } finally {
                setSaving(false)
              }
            }}
            className="px-3 py-2 rounded-lg bg-black text-white border-2 border-black hover:border-orange-500 hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </td>
    </tr>
  )
}

