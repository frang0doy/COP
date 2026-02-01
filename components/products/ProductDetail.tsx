'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { ShoppingCart, ArrowLeft, CheckCircle, Download } from 'lucide-react'
import Link from 'next/link'
import { CATEGORY_LABEL, CATEGORY_THEME, type CategoryKey } from './catalog'
import type { Product } from '@prisma/client'

interface ProductDetailProps {
  productId: string
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    ;(async () => {
      const res = await fetch(`/api/products/${productId}`, { cache: 'no-store' })
      if (!res.ok) {
        if (!cancelled) {
          setProduct(null)
          setIsLoading(false)
        }
        return
      }
      const data = (await res.json()) as Product
      if (cancelled) return
      setProduct(data)
      setIsLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [productId])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-500">Cargando producto...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-500">Producto no encontrado</p>
          <Link href="/productos" className="text-black hover:text-gray-600 transition-colors mt-4 inline-block">
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  const MAX_PER_PRODUCT = 10
  const maxAllowed = Math.max(0, Math.min(MAX_PER_PRODUCT, product.stock))

  const handleAddToCart = () => {
    if (maxAllowed <= 0) return
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image ?? undefined,
        stock: product.stock,
      },
      quantity
    )
  }

  const categoryKey: CategoryKey =
    product.category in CATEGORY_THEME
      ? (product.category as CategoryKey)
      : 'adhesivos'

  const theme = CATEGORY_THEME[categoryKey]
  const categoryLabel =
    categoryKey in CATEGORY_LABEL ? CATEGORY_LABEL[categoryKey] : 'Producto'

  const technicalSummary = (product.technicalSummary ?? null) as any

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/productos"
        className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al catálogo</span>
      </Link>

      {/* Contenedor único para que todo quede alineado y dentro del mismo margen */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="h-1 w-full bg-gray-100">
          <div className={['h-1 w-28', theme.accent].join(' ')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Columna izquierda: imagen (se estira a la altura del panel derecho) */}
          <div className="bg-gray-50 p-6 sm:p-10 flex items-center justify-center">
            <div className="w-full flex items-center justify-center">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="block w-full max-w-[600px] lg:max-w-[680px] max-h-[560px] lg:max-h-[640px] object-contain"
                />
              ) : (
                <span className="text-gray-400">Imagen del Producto</span>
              )}
            </div>
          </div>

          {/* Columna derecha: información */}
          <div className="border-t border-gray-200 lg:border-t-0 lg:border-l p-6 sm:p-10">
          <span className="text-xs text-gray-600 font-medium tracking-wider uppercase flex items-center gap-2">
            <span className={['w-2 h-2', theme.accent].join(' ')} />
            {categoryLabel}
          </span>

          <div className="mt-2 mb-4 flex items-start gap-3 flex-wrap">
            <h1 className="text-4xl font-bold text-black tracking-tight">{product.name}</h1>
            {product.technicalSheet ? (
              <a
                href={product.technicalSheet}
                download
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-sm font-semibold hover:border-orange-500 transition-colors"
                aria-label="Descargar ficha técnica"
                title="Descargar ficha técnica"
              >
                <Download className="w-4 h-4" />
                Descargar ficha técnica
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-400 cursor-not-allowed"
                aria-label="Ficha técnica no disponible"
                title="Ficha técnica no disponible"
              >
                <Download className="w-4 h-4" />
                Descargar ficha técnica
              </button>
            )}
          </div>
          <p className="text-2xl font-bold text-black mb-6">
            ${product.price.toLocaleString('es-MX')}
          </p>

          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* INFOGRAFÍA (estilo ficha, inspirado en la referencia) */}
          {technicalSummary && (
            <section className="mb-6">
              <div className="bg-white border border-gray-200 overflow-hidden ring-1 ring-black/5">
                <div className="h-1 w-full bg-gray-100">
                  <div className={['h-1 w-28', theme.accent].join(' ')} />
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                        Infografía
                      </p>
                      <p className="text-lg font-semibold text-black mt-1">
                        Datos clave del producto
                      </p>
                    </div>
                    {technicalSummary.observaciones && (
                      <span className="text-xs font-semibold text-black bg-gray-100 border border-gray-200 px-2 py-1 shrink-0">
                        {technicalSummary.observaciones}
                      </span>
                    )}
                  </div>

                  {/* Presentación destacada */}
                  {technicalSummary.presentacion && (
                    <div className="mt-5 border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                        Presentación
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-black mt-1">
                        {technicalSummary.presentacion}
                      </p>
                    </div>
                  )}

                  {/* Bullets (sin duplicar toda la ficha; solo lo más “vendible”) */}
                  <ul className="mt-5 space-y-2 text-sm text-gray-700">
                    {technicalSummary.rendimiento && (
                      <li className="flex gap-2">
                        <span className={['mt-2 w-2 h-2 shrink-0', theme.accent].join(' ')} />
                        <span>
                          <span className="font-semibold text-black">Rendimiento:</span>{' '}
                          {technicalSummary.rendimiento}
                        </span>
                      </li>
                    )}
                    {technicalSummary.conservacion && (
                      <li className="flex gap-2">
                        <span className={['mt-2 w-2 h-2 shrink-0', theme.accent].join(' ')} />
                        <span>
                          <span className="font-semibold text-black">Conservación:</span>{' '}
                          {technicalSummary.conservacion}
                        </span>
                      </li>
                    )}
                    {technicalSummary.almacenaje && (
                      <li className="flex gap-2">
                        <span className={['mt-2 w-2 h-2 shrink-0', theme.accent].join(' ')} />
                        <span>
                          <span className="font-semibold text-black">Almacenaje:</span>{' '}
                          {technicalSummary.almacenaje}
                        </span>
                      </li>
                    )}
                  </ul>

                  {/* Bloques tipo “ficha” */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {technicalSummary.colores && (
                      <div className="border border-gray-200 p-4">
                        <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                          Colores del producto
                        </p>
                        <p className="text-black mt-2 line-clamp-3">
                          {technicalSummary.colores}
                        </p>
                      </div>
                    )}
                    {technicalSummary.usos && (
                      <div className="border border-gray-200 p-4 sm:col-span-2">
                        <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                          Usos
                        </p>
                        <p className="text-black mt-2 line-clamp-5">
                          {technicalSummary.usos}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Especificaciones */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">
                {product.stock > 0 ? `Stock: ${maxAllowed}` : 'Sin stock'}
              </span>
            </div>
          </div>

          {/* Cantidad y agregar al carrito */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center border-2 border-black rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="px-4 py-2 hover:bg-black hover:text-white transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxAllowed || 1}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1
                    setQuantity(Math.max(1, Math.min(val, maxAllowed || 1)))
                  }}
                  className="w-20 text-center border-0 focus:ring-0 bg-transparent"
                />
                <button
                  onClick={() => setQuantity(Math.min((maxAllowed || 1), quantity + 1))}
                  disabled={maxAllowed <= 0 || quantity >= (maxAllowed || 1)}
                  className="px-4 py-2 hover:bg-black hover:text-white transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={maxAllowed <= 0}
            className={`w-full flex items-center justify-center space-x-2 px-6 py-3 border-2 font-semibold text-lg transition-colors duration-200 ${
              maxAllowed > 0
                ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600 hover:border-orange-600'
                : 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>
              {maxAllowed > 0 ? `Agregar ${quantity} al Carrito` : 'Sin stock'}
            </span>
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}

