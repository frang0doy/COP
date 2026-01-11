'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { ShoppingCart, ArrowLeft, CheckCircle, Download } from 'lucide-react'
import Link from 'next/link'
import { CATEGORY_LABEL, CATEGORY_THEME, PRODUCTS, type Product } from './catalog'

interface ProductDetailProps {
  productId: string
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  useEffect(() => {
    const foundProduct = PRODUCTS.find((p) => p.id === parseInt(productId))
    setProduct(foundProduct || null)
  }, [productId])

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

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        // Stock desactivado por ahora hasta integrar DB
        stock: Number.MAX_SAFE_INTEGER,
      })
    }
  }

  const theme = CATEGORY_THEME[product.category]

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
          <div className="border-t border-gray-200 lg:border-t-0 lg:border-l border-gray-200 p-6 sm:p-10">
          <span className="text-xs text-gray-600 font-medium tracking-wider uppercase flex items-center gap-2">
            <span className={['w-2 h-2', theme.accent].join(' ')} />
            {CATEGORY_LABEL[product.category]}
          </span>

          <div className="mt-2 mb-4 flex items-start gap-3 flex-wrap">
            <h1 className="text-4xl font-bold text-black tracking-tight">{product.name}</h1>
            {product.technicalSheet ? (
              <a
                href={product.technicalSheet}
                download
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-sm font-semibold hover:border-black transition-colors"
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
          {product.technicalSummary && (
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
                    {product.technicalSummary.observaciones && (
                      <span className="text-xs font-semibold text-black bg-gray-100 border border-gray-200 px-2 py-1 shrink-0">
                        {product.technicalSummary.observaciones}
                      </span>
                    )}
                  </div>

                  {/* Presentación destacada */}
                  {product.technicalSummary.presentacion && (
                    <div className="mt-5 border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                        Presentación
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-black mt-1">
                        {product.technicalSummary.presentacion}
                      </p>
                    </div>
                  )}

                  {/* Bullets (sin duplicar toda la ficha; solo lo más “vendible”) */}
                  <ul className="mt-5 space-y-2 text-sm text-gray-700">
                    {product.technicalSummary.rendimiento && (
                      <li className="flex gap-2">
                        <span className={['mt-2 w-2 h-2 shrink-0', theme.accent].join(' ')} />
                        <span>
                          <span className="font-semibold text-black">Rendimiento:</span>{' '}
                          {product.technicalSummary.rendimiento}
                        </span>
                      </li>
                    )}
                    {product.technicalSummary.conservacion && (
                      <li className="flex gap-2">
                        <span className={['mt-2 w-2 h-2 shrink-0', theme.accent].join(' ')} />
                        <span>
                          <span className="font-semibold text-black">Conservación:</span>{' '}
                          {product.technicalSummary.conservacion}
                        </span>
                      </li>
                    )}
                    {product.technicalSummary.almacenaje && (
                      <li className="flex gap-2">
                        <span className={['mt-2 w-2 h-2 shrink-0', theme.accent].join(' ')} />
                        <span>
                          <span className="font-semibold text-black">Almacenaje:</span>{' '}
                          {product.technicalSummary.almacenaje}
                        </span>
                      </li>
                    )}
                  </ul>

                  {/* Bloques tipo “ficha” */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {product.technicalSummary.colores && (
                      <div className="border border-gray-200 p-4">
                        <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                          Colores del producto
                        </p>
                        <p className="text-black mt-2 line-clamp-3">
                          {product.technicalSummary.colores}
                        </p>
                      </div>
                    )}
                    {product.technicalSummary.usos && (
                      <div className="border border-gray-200 p-4 sm:col-span-2">
                        <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                          Usos
                        </p>
                        <p className="text-black mt-2 line-clamp-5">
                          {product.technicalSummary.usos}
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
              <span className="text-gray-600">Producto disponible</span>
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
                  className="px-4 py-2 hover:bg-black hover:text-white transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1
                    setQuantity(Math.max(1, val))
                  }}
                  className="w-20 text-center border-0 focus:ring-0 bg-transparent"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-black hover:text-white transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className={`w-full flex items-center justify-center space-x-2 px-6 py-3 border-2 font-semibold text-lg transition ${
              'bg-black text-white border-black hover:bg-gray-900'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>
              {`Agregar ${quantity} al Carrito`}
            </span>
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}

