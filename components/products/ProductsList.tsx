'use client'

import { useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import { Search, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { CATEGORY_LABEL, CATEGORY_ORDER, CATEGORY_THEME, type CategoryKey } from './catalog'
import type { Product } from '@prisma/client'

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([])
  const totalProducts = products.length
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | CategoryKey>('Todos')
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' })
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(text || `Error HTTP ${res.status}`)
        }
        const data = (await res.json()) as Product[]
        if (cancelled) return
        setProducts(data)
        setFilteredProducts(data)
        setLoadError(null)
      } catch (e) {
        console.error(e)
        if (!cancelled) setLoadError('No se pudieron cargar los productos.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let filtered = products

    // Filtrar por categoría
    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter((p) => p.category === selectedCategory)
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }, [searchTerm, selectedCategory, products])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('Todos')
  }

  const selectedTheme =
    selectedCategory === 'Todos' ? null : CATEGORY_THEME[selectedCategory]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-10">
      {/* Filtro (siempre visible en desktop) */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-5">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
              Productos
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Mostrando <span className="font-semibold text-black">{filteredProducts.length}</span> de{' '}
              <span className="font-semibold text-black">{totalProducts}</span>
              {selectedCategory !== 'Todos'
                ? ` · ${CATEGORY_LABEL[selectedCategory]}`
                : ''}
            </p>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-gray-200 focus:border-black transition-colors bg-white text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Categorías */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold tracking-wider text-gray-700 uppercase">
                Filtro
              </p>
              {(searchTerm || selectedCategory !== 'Todos') && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-600 hover:text-black underline"
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('Todos')}
                className={[
                  'shrink-0 w-full lg:w-auto text-left px-3 py-2 border transition-colors',
                  selectedCategory === 'Todos'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white text-black hover:border-black',
                ].join(' ')}
              >
                <span className="text-sm font-medium">Todos</span>
              </button>

              {CATEGORY_ORDER.map((cat) => {
                const isSelected = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={[
                      'shrink-0 w-full lg:w-auto text-left px-3 py-2 border transition-colors',
                      isSelected
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 bg-white text-black hover:border-black',
                    ].join(' ')}
                  >
                    <span className="text-sm font-medium">{CATEGORY_LABEL[cat]}</span>
                  </button>
                )
              })}
            </div>
          </div>
          </div>
        </div>
      </aside>

      {/* Lista */}
      <section>
        <div
          className={[
            'border border-gray-200 bg-white',
            selectedTheme ? 'ring-1 ring-black/5' : '',
          ].join(' ')}
        >
          {selectedTheme && (
            <div className="h-1 w-full">
              <div className={['h-1 w-28', selectedTheme.accent].join(' ')} />
            </div>
          )}

          <div className="p-4 md:p-6">
            {loadError ? (
              <div className="text-center py-16">
                <p className="text-gray-600 mb-4">{loadError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-black hover:text-gray-600 underline"
                >
                  Reintentar
                </button>
              </div>
            ) : null}
            {!loadError && filteredProducts.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
                layout
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.01,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    layout
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            ) : !loadError ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg mb-4">No se encontraron productos</p>
                <button onClick={clearFilters} className="text-black hover:text-gray-600 underline">
                  Limpiar filtros
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
