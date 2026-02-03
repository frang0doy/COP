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

  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin · Productos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Editá stock/precio desde acá. (Acceso solo ADMIN)
          </p>
        </div>

        {isAdmin === false ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-red-600 font-semibold">No autorizado</p>
            <p className="text-sm text-gray-600 mt-1">
              Para habilitar admin, agregá tu email en `ADMIN_EMAILS` (Vercel env) y volvé a iniciar
              sesión.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por ID, SKU, nombre o categoría..."
                className="w-full sm:max-w-md px-3 py-2 border border-gray-300 rounded-lg"
              />
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
                className="px-4 py-2 bg-orange-500 text-white border border-orange-500 hover:bg-orange-600 hover:border-orange-600 transition-colors duration-200"
              >
                Refrescar
              </button>
            </div>

            {loading ? (
              <p className="text-gray-600">Cargando productos...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">SKU</th>
                      <th className="py-2 pr-4">Nombre</th>
                      <th className="py-2 pr-4">Categoría</th>
                      <th className="py-2 pr-4">Precio</th>
                      <th className="py-2 pr-4">Stock</th>
                      <th className="py-2 pr-0">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
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
    <tr className="border-b last:border-b-0 align-top">
      <td className="py-2 pr-4 font-semibold">{product.id}</td>
      <td className="py-2 pr-4">{product.sku}</td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-2">
          <span>{product.name}</span>
          {(product.isActive ?? true) ? null : (
            <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-800 border border-gray-200">
              PAUSADO
            </span>
          )}
        </div>
      </td>
      <td className="py-2 pr-4">{product.category}</td>
      <td className="py-2 pr-4">
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-28 px-2 py-1 border border-gray-300 rounded"
          inputMode="numeric"
        />
      </td>
      <td className="py-2 pr-4">
        <input
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-24 px-2 py-1 border border-gray-300 rounded"
          inputMode="numeric"
        />
      </td>
      <td className="py-2 pr-0">
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
            className="px-3 py-2 border border-gray-300 bg-white hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="px-3 py-2 bg-black text-white border-2 border-black hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </td>
    </tr>
  )
}

