'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { ShoppingCart, ArrowLeft, Package, CheckCircle, FileText } from 'lucide-react'
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
        stock: product.stock,
      })
    }
  }

  const isOutOfStock = product.stock === 0
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Imagen del producto */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="h-1 w-full bg-gray-100">
            <div className={['h-1 w-28', theme.accent].join(' ')} />
          </div>
          <div className="bg-gray-100 h-96 flex items-center justify-center overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-gray-400">Imagen del Producto</span>
            )}
          </div>
        </div>

        {/* Información del producto */}
        <div>
          <span className="text-xs text-gray-600 font-medium tracking-wider uppercase flex items-center gap-2">
            <span className={['w-2 h-2', theme.accent].join(' ')} />
            {CATEGORY_LABEL[product.category]}
          </span>

          <div className="mt-2 mb-4 flex items-start gap-3 flex-wrap">
            <h1 className="text-4xl font-bold text-black tracking-tight">{product.name}</h1>
            {/* Solo diseño/estructura por ahora */}
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-sm font-semibold hover:border-black transition-colors"
              aria-label="Descargar ficha técnica (próximamente)"
            >
              <FileText className="w-4 h-4" />
              Descargar ficha técnica
            </button>
          </div>
          <p className="text-2xl font-bold text-black mb-6">
            ${product.price.toLocaleString('es-MX')}
          </p>

          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Especificaciones */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">SKU: {product.sku}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">
                Stock disponible: {product.stock} unidades
              </span>
            </div>
          </div>

          {/* Cantidad y agregar al carrito */}
          {!isOutOfStock && (
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
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      setQuantity(Math.min(Math.max(1, val), product.stock))
                    }}
                    className="w-20 text-center border-0 focus:ring-0 bg-transparent"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 hover:bg-black hover:text-white transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full flex items-center justify-center space-x-2 px-6 py-3 border-2 font-semibold text-lg transition ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-black text-white border-black hover:bg-gray-900'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>
              {isOutOfStock
                ? 'Sin Stock Disponible'
                : `Agregar ${quantity} al Carrito`}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

