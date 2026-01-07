'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { ShoppingCart, ArrowLeft, Package, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { Product } from './ProductsList'

// Datos de ejemplo - en producción vendrán de una API
// Estos deben coincidir con los productos en ProductsList
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Adhesivo Cerámico Premium',
    description: 'Adhesivo de alta adherencia para cerámicos y porcelanatos. Formulación europea con excelente cobertura y durabilidad. Ideal para profesionales de la construcción. Perfecto para aplicaciones en interiores y exteriores con alta resistencia al agua y cambios de temperatura.',
    price: 1250,
    category: 'ADHESIVOS',
    stock: 50,
    sku: 'ADH-001',
  },
  {
    id: 2,
    name: 'Adhesivo Flex',
    description: 'Adhesivo flexible para exteriores y zonas de tráfico. Diseñado para soportar movimientos estructurales y condiciones climáticas extremas.',
    price: 1450,
    category: 'ADHESIVOS',
    stock: 35,
    sku: 'ADH-002',
  },
  {
    id: 3,
    name: 'Adhesivo Rápido',
    description: 'Adhesivo de fraguado rápido para trabajos urgentes. Permite continuar con el trabajo en menos tiempo sin comprometer la calidad.',
    price: 1680,
    category: 'ADHESIVOS',
    stock: 28,
    sku: 'ADH-003',
  },
  {
    id: 4,
    name: 'Estucado Acrílico',
    description: 'Estucado acrílico decorativo para interiores. Acabado liso y uniforme ideal para espacios modernos.',
    price: 1890,
    category: 'ESTUCADOS',
    stock: 40,
    sku: 'EST-001',
  },
  {
    id: 5,
    name: 'Estucado Texturado',
    description: 'Estucado texturado para fachadas exteriores. Proporciona textura y protección contra la intemperie.',
    price: 2150,
    category: 'ESTUCADOS',
    stock: 30,
    sku: 'EST-002',
  },
  {
    id: 6,
    name: 'Estucado Liso',
    description: 'Estucado liso de acabado perfecto. Ideal para superficies que requieren un acabado impecable.',
    price: 1750,
    category: 'ESTUCADOS',
    stock: 45,
    sku: 'EST-003',
  },
  {
    id: 7,
    name: 'Impermeabilizante Elastómero',
    description: 'Impermeabilizante de alta resistencia para terrazas y azoteas. Excelente adherencia y resistencia a la intemperie. Formulación elástica que se adapta a movimientos estructurales.',
    price: 3200,
    category: 'IMPERMEABILIZANTES',
    stock: 25,
    sku: 'IMP-001',
  },
  {
    id: 8,
    name: 'Impermeabilizante Acrílico',
    description: 'Impermeabilizante acrílico para muros y fachadas. Protección duradera contra la humedad y filtraciones.',
    price: 2850,
    category: 'IMPERMEABILIZANTES',
    stock: 32,
    sku: 'IMP-002',
  },
  {
    id: 9,
    name: 'Impermeabilizante Transparente',
    description: 'Impermeabilizante transparente que no altera el color original. Ideal para preservar la apariencia de la superficie.',
    price: 2950,
    category: 'IMPERMEABILIZANTES',
    stock: 20,
    sku: 'IMP-003',
  },
  {
    id: 10,
    name: 'Laca Poliuretánica',
    description: 'Laca de alta resistencia para muebles y superficies de madera. Acabado brillante y duradero.',
    price: 2450,
    category: 'LACA Y BARNICES',
    stock: 38,
    sku: 'LAC-001',
  },
  {
    id: 11,
    name: 'Barniz Protector',
    description: 'Barniz protector UV para exteriores. Protege la madera de los rayos solares y la intemperie.',
    price: 2200,
    category: 'LACA Y BARNICES',
    stock: 42,
    sku: 'LAC-002',
  },
  {
    id: 12,
    name: 'Laca Acrílica',
    description: 'Laca acrílica de secado rápido. Ideal para proyectos con tiempos ajustados.',
    price: 1980,
    category: 'LACA Y BARNICES',
    stock: 50,
    sku: 'LAC-003',
  },
  {
    id: 13,
    name: 'Revestimiento Texturado',
    description: 'Revestimiento texturado para fachadas con excelente adherencia y resistencia a la intemperie. Proporciona textura y protección duradera.',
    price: 1890,
    category: 'REVESTIMIENTO Y REVOQUE',
    stock: 30,
    sku: 'REV-001',
  },
  {
    id: 14,
    name: 'Revestimiento Acrílico',
    description: 'Revestimiento acrílico decorativo para interiores. Acabado suave y elegante.',
    price: 1650,
    category: 'REVESTIMIENTO Y REVOQUE',
    stock: 40,
    sku: 'REV-002',
  },
  {
    id: 15,
    name: 'Revoque Plástico',
    description: 'Revoque plástico de alta calidad para exteriores. Excelente resistencia y durabilidad.',
    price: 1750,
    category: 'REVESTIMIENTO Y REVOQUE',
    stock: 35,
    sku: 'REV-003',
  },
  {
    id: 16,
    name: 'Revestimiento Elastómero',
    description: 'Revestimiento elástico para zonas con movimiento. Se adapta a cambios estructurales sin agrietarse.',
    price: 2100,
    category: 'REVESTIMIENTO Y REVOQUE',
    stock: 28,
    sku: 'REV-004',
  },
]

interface ProductDetailProps {
  productId: string
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  useEffect(() => {
    const foundProduct = mockProducts.find((p) => p.id === parseInt(productId))
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
        <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
          <span className="text-gray-400">Imagen del Producto</span>
        </div>

        {/* Información del producto */}
        <div>
          <span className="text-xs text-gray-500 font-medium tracking-wider uppercase">{product.category}</span>
          <h1 className="text-4xl font-bold text-black mt-2 mb-4">{product.name}</h1>
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

