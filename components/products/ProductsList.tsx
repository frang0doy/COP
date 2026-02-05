'use client'

import { useEffect, useRef, useState } from 'react'
import ProductCard from './ProductCard'
import { ChevronDown, Search, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { CATEGORY_LABEL, CATEGORY_ORDER, CATEGORY_THEME, type CategoryKey } from './catalog'
import type { Product } from '@prisma/client'

type ApplyAreaKey =
  | 'interiores'
  | 'exteriores'
  | 'pisos'
  | 'piletas'
  | 'muros_humedos'
  | 'construccion_en_seco'

const APPLY_AREA_ORDER: ApplyAreaKey[] = [
  'interiores',
  'exteriores',
  'pisos',
  'piletas',
  'muros_humedos',
  'construccion_en_seco',
]

const APPLY_AREA_LABEL: Record<ApplyAreaKey, string> = {
  interiores: 'Interiores',
  exteriores: 'Exteriores',
  pisos: 'Pisos',
  piletas: 'Piletas',
  muros_humedos: 'Muros húmedos',
  construccion_en_seco: 'Construcciones en seco',
}

function stripDiacritics(input: string) {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normText(input: string) {
  return stripDiacritics(input).toLowerCase()
}

function getProductUsos(product: Product) {
  const ts = (product as any)?.technicalSummary
  const usos = ts?.usos
  return typeof usos === 'string' ? usos : ''
}

function computeApplyAreas(product: Product): ApplyAreaKey[] {
  const hay = [
    product.name ?? '',
    product.description ?? '',
    String((product as any)?.category ?? ''),
    getProductUsos(product),
  ]
    .filter(Boolean)
    .join(' | ')

  const t = normText(hay)
  const out = new Set<ApplyAreaKey>()

  // Construcción en seco
  if (
    t.includes('construccion en seco') ||
    t.includes('carton yeso') ||
    t.includes('placas de yeso') ||
    t.includes('placas de carton yeso') ||
    t.includes('fibrocemento') ||
    t.includes('juntas')
  ) {
    out.add('construccion_en_seco')
  }

  // Piletas
  if (t.includes('piscina') || t.includes('pilet')) {
    out.add('piletas')
  }

  // Pisos
  if (
    t.includes('pisos') ||
    t.includes('piso') ||
    t.includes('porcelanato') ||
    t.includes('ceramic') ||
    t.includes('carpeta') ||
    t.includes('nivelacion') ||
    t.includes('piso sobre piso')
  ) {
    out.add('pisos')
  }

  // Muros húmedos (humedad/salitre/baños/cisternas/tanques)
  if (
    t.includes('humedad') ||
    t.includes('humedades') ||
    t.includes('salitre') ||
    t.includes('banos') ||
    t.includes('baños') ||
    t.includes('duchas') ||
    t.includes('cistern') ||
    t.includes('tanques') ||
    t.includes('impermeabil')
  ) {
    out.add('muros_humedos')
  }

  // Exteriores (exterior/techos/terrazas/balcones)
  if (
    t.includes('exterior') ||
    t.includes('paredes exteriores') ||
    t.includes('terraz') ||
    t.includes('tech') ||
    t.includes('balcon') ||
    t.includes('tinglado')
  ) {
    out.add('exteriores')
  }

  // Interiores
  if (
    t.includes('interior') ||
    // fallback razonable por familias típicas “de interior”
    String((product as any)?.category ?? '') === 'estucados' ||
    String((product as any)?.category ?? '') === 'revestimientos' ||
    String((product as any)?.category ?? '') === 'selladores_y_pinturas'
  ) {
    out.add('interiores')
  }

  // Fallbacks por tipo de producto
  if (out.size === 0) {
    const cat = String((product as any)?.category ?? '')
    if (cat === 'impermeabilizables') {
      out.add('exteriores')
      out.add('muros_humedos')
    } else if (cat === 'revoques' || cat === 'adhesivos' || cat === 'laca_y_barnices') {
      out.add('interiores')
    }
  }

  return Array.from(out)
}

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([])
  const totalProducts = products.length
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | CategoryKey>('Todos')
  const [selectedApplyArea, setSelectedApplyArea] = useState<'Todos' | ApplyAreaKey>('Todos')
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const applyButtonRef = useRef<HTMLButtonElement | null>(null)
  const applyPanelRef = useRef<HTMLDivElement | null>(null)
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

    // Filtrar por "Dónde aplicar"
    if (selectedApplyArea !== 'Todos') {
      filtered = filtered.filter((p) => computeApplyAreas(p).includes(selectedApplyArea))
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const q = normText(searchTerm)
      filtered = filtered.filter(
        (p) =>
          normText(p.name).includes(q) ||
          normText(p.description).includes(q) ||
          normText(getProductUsos(p)).includes(q)
      )
    }

    setFilteredProducts(filtered)
  }, [searchTerm, selectedCategory, selectedApplyArea, products])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('Todos')
    setSelectedApplyArea('Todos')
  }

  const selectedTheme =
    selectedCategory === 'Todos' ? null : CATEGORY_THEME[selectedCategory]

  // Cerrar dropdown al click afuera / Escape
  useEffect(() => {
    if (!isApplyOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsApplyOpen(false)
    }
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      const clickedButton = applyButtonRef.current?.contains(target) ?? false
      const clickedPanel = applyPanelRef.current?.contains(target) ?? false
      if (!clickedButton && !clickedPanel) setIsApplyOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [isApplyOpen])

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
              Mostrando{' '}
              <span className="font-semibold text-black">{filteredProducts.length}</span> de{' '}
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
              {(searchTerm || selectedCategory !== 'Todos' || selectedApplyArea !== 'Todos') && (
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
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-gray-200 bg-white text-black hover:border-orange-500 hover:text-orange-500',
                ].join(' ')}
              >
                <span className="text-sm font-medium">Todos</span>
              </button>

              {CATEGORY_ORDER.filter((c) => c !== 'combos').map((cat) => {
                const isSelected = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={[
                      'shrink-0 w-full lg:w-auto text-left px-3 py-2 border transition-colors',
                      isSelected
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-gray-200 bg-white text-black hover:border-orange-500 hover:text-orange-500',
                    ].join(' ')}
                  >
                    <span className="text-sm font-medium">{CATEGORY_LABEL[cat]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dónde aplicar (debajo de categorías) */}
          <div className="mt-2">
            <button
              ref={applyButtonRef}
              type="button"
              onClick={() => setIsApplyOpen((v) => !v)}
              className={[
                // Igualar estilo/tamaño a los botones de categorías
                'w-full flex items-center justify-between gap-3 px-3 py-2 border transition-colors text-left',
                isApplyOpen
                  ? 'border-orange-500 bg-white text-black'
                  : 'border-gray-200 bg-white text-black hover:border-orange-500 hover:text-orange-500',
                'focus:outline-none focus:border-black',
              ].join(' ')}
              aria-haspopup="listbox"
              aria-expanded={isApplyOpen}
            >
              <span className="min-w-0 flex-1 text-left text-sm font-medium text-gray-900">
                {selectedApplyArea === 'Todos'
                  ? 'Dónde aplicar'
                  : APPLY_AREA_LABEL[selectedApplyArea]}
              </span>
              <ChevronDown
                className={[
                  'w-4 h-4 text-gray-500 transition-transform',
                  isApplyOpen ? 'rotate-180' : '',
                ].join(' ')}
              />
            </button>

            {isApplyOpen ? (
              <div
                ref={applyPanelRef}
                className="mt-2 w-full border border-gray-200 bg-white shadow-lg overflow-hidden"
                role="listbox"
                aria-label="Dónde aplicar"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedApplyArea === 'Todos'}
                  onClick={() => {
                    setSelectedApplyArea('Todos')
                    setIsApplyOpen(false)
                  }}
                  className={[
                    'w-full text-left px-3 py-2 text-sm transition-colors',
                    selectedApplyArea === 'Todos'
                      ? 'bg-orange-50 text-orange-700'
                      : 'hover:bg-orange-50 hover:text-orange-700',
                  ].join(' ')}
                >
                  Quitar filtro
                </button>
                {APPLY_AREA_ORDER.map((k) => {
                  const selected = selectedApplyArea === k
                  return (
                    <button
                      key={k}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setSelectedApplyArea(k)
                        setIsApplyOpen(false)
                      }}
                      className={[
                        'w-full text-left px-3 py-2 text-sm transition-colors',
                        selected
                          ? 'bg-orange-50 text-orange-700'
                          : 'hover:bg-orange-50 hover:text-orange-700',
                      ].join(' ')}
                    >
                      {APPLY_AREA_LABEL[k]}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          {/* Combos (al final, debajo de "Dónde aplicar") */}
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                // Para que SIEMPRE se vea el combo al entrar acá
                setSearchTerm('')
                setSelectedApplyArea('Todos')
                setSelectedCategory('combos')
              }}
              className={[
                'w-full text-left px-3 py-2 border transition-colors',
                selectedCategory === 'combos'
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : 'border-gray-200 bg-white text-black hover:border-orange-500 hover:text-orange-500',
              ].join(' ')}
            >
              <span className="text-sm font-medium">Combos</span>
            </button>
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
