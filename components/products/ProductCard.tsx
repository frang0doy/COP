'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export type ProductCardVariant = {
  id: number
  name: string
  price: number
  wholesalePrice?: number | null
  stock: number
  variantLabel: string
}

export type ProductCardGroup = {
  id: number
  name: string
  description: string
  image: string | null
  isNew: boolean
  category: string
  variants: ProductCardVariant[]
}

interface ProductCardProps {
  product: ProductCardGroup
  /** Usuario mayorista aprobado: muestra lista mayorista si está cargada en el producto. */
  isWholesaleViewer?: boolean
}

export default function ProductCard({ product, isWholesaleViewer }: ProductCardProps) {
  /** Misma fila que el enlace "Ver" (id del grupo): precio base en catálogo, no el de otras variantes. */
  const v0 = product.variants[0]
  const listPrice = v0?.price ?? 0
  const ws = v0?.wholesalePrice
  const displayPrice =
    isWholesaleViewer && ws != null && Number.isFinite(ws) ? Math.floor(ws) : listPrice

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      <div className="h-full">
        <div className="bg-white border border-gray-200 overflow-hidden h-full flex flex-col group">
          {/* Imagen del producto */}
          <div className="relative h-40 sm:h-56 md:h-64 bg-gray-100 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100" />
              )}
            </div>
            {product.isNew && (
              <div className="absolute top-2 right-2 bg-black text-white px-2 py-1 text-xs font-semibold">
                Nuevo producto
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="p-3 md:p-4 flex-1 flex flex-col">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-black line-clamp-2">
              <span className="relative inline-block">
                {product.name}
                {/* Subrayado deslizante */}
                <span className="pointer-events-none absolute left-0 -bottom-1 h-[2px] w-full origin-left scale-x-0 bg-black transition-transform duration-300 group-hover:scale-x-100" />
              </span>
            </h3>

            <div className="mt-auto">
              <div className="flex items-center justify-between gap-3 mt-3">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-black">
                  ${displayPrice.toLocaleString('es-MX')}
                </span>
                <Link
                  href={`/productos/${product.id}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-200 bg-white text-xs sm:text-sm font-semibold transition-transform duration-200 hover:scale-[1.03] hover:border-orange-500"
                >
                  Ver
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
