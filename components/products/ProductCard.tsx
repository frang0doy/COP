'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { ShoppingCart } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Product } from './ProductsList'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock,
    })
  }

  const isOutOfStock = product.stock === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ y: -4 }}
    >
      <Link href={`/productos/${product.id}`}>
        <div className="bg-white border border-gray-200 overflow-hidden hover:border-black transition-all duration-300 h-full flex flex-col group cursor-pointer hover:shadow-lg">
          {/* Imagen del producto */}
          <div className="relative h-64 bg-gray-100 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100 group-hover:from-gray-300 group-hover:to-gray-200 transition-all duration-500 group-hover:scale-110" />
              )}
            </div>
            {isOutOfStock && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 bg-black text-white px-3 py-1 text-xs font-semibold"
              >
                Sin Stock
              </motion.div>
            )}
          </div>

          {/* Información del producto */}
          <div className="p-4 flex-1 flex flex-col">
            <span className="text-xs text-gray-500 font-medium tracking-wider uppercase">{product.category}</span>
            <h3 className="text-lg font-semibold text-black mt-2 mb-2 line-clamp-2 group-hover:text-gray-600 transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-2">
              {product.description}
            </p>

            <div className="mt-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-black">
                  ${product.price.toLocaleString('es-MX')}
                </span>
                <span className="text-sm text-gray-500">
                  Stock: {product.stock}
                </span>
              </div>

              <motion.button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                whileHover={!isOutOfStock ? { scale: 1.02 } : {}}
                whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 font-semibold transition-colors ${
                  isOutOfStock
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-black text-white border-black hover:bg-gray-900'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isOutOfStock ? 'Sin Stock' : 'Agregar al Carrito'}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
