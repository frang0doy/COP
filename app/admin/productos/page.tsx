'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

type Product = {
  id: number
  sku: string
  name: string
  category: string
  price: number
  stock: number
  image?: string | null
  isNew?: boolean
  isActive?: boolean
}

export default function AdminProductosPage() {
  const { data: session, status } = useSession()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
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

  const loadProducts = async () => {
    const res = await fetch('/api/admin/products', { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar los productos')
    setProducts((data?.products ?? []) as Product[])
  }

  useEffect(() => {
    if (status !== 'authenticated') return
    if (isAdmin === false) return
    if (isAdmin === null) return

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        String(p.id).includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
  }, [products, query])

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
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin · Productos</h1>
            <p className="text-sm text-gray-600 mt-1">
              Editá stock/precio y pausá productos del catálogo.
            </p>
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
                <p className="text-sm text-gray-600 mt-1">
                  Para habilitar admin, agregá tu email en <code className="font-semibold">ADMIN_EMAILS</code> (Vercel env) y volvé a iniciar sesión.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="w-full sm:max-w-md">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Buscar
                </label>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ID, SKU, nombre o categoría…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition bg-white"
                />
              </div>
              <div className="flex items-end gap-2">
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
                    {filtered.map((p) => (
                      <AdminRow key={p.id} product={p} onSave={updateProduct} />
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

function AdminRow({
  product,
  onSave,
}: {
  product: Product
  onSave: (id: number, patch: Partial<Product>) => Promise<void>
}) {
  const [price, setPrice] = useState(String(product.price))
  const [stock, setStock] = useState(String(product.stock))
  const [isActive, setIsActive] = useState(product.isActive ?? true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPrice(String(product.price))
    setStock(String(product.stock))
    setIsActive(product.isActive ?? true)
  }, [product.price, product.stock, product.isActive])

  const dirty =
    Number(price) !== product.price ||
    Number(stock) !== product.stock ||
    (product.isActive ?? true) !== isActive

  return (
    <tr className="border-b last:border-b-0 border-gray-100 align-top hover:bg-orange-50/30 transition-colors">
      <td className="py-3 px-4 font-semibold text-gray-900">{product.id}</td>
      <td className="py-3 px-4 text-gray-800">{product.sku}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-900">{product.name}</span>
          {(product.isActive ?? true) ? null : (
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
            title={(product.isActive ?? true) ? 'Pausar (ocultar del catálogo)' : 'Activar (mostrar en catálogo)'}
          >
            {(product.isActive ?? true) ? 'Pausar' : 'Activar'}
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

