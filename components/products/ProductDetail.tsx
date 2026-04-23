'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useCart } from '@/context/CartContext'
import {
  ShoppingCart,
  ArrowLeft,
  CheckCircle,
  Download,
  XCircle,
  Calculator,
  X,
  ImageIcon,
  Palette,
} from 'lucide-react'
import Link from 'next/link'
import { CATEGORY_LABEL, CATEGORY_THEME, type CategoryKey } from './catalog'
import type { Product } from '@prisma/client'
import ConsumptionCalculatorModal from './ConsumptionCalculatorModal'
import { detectGroupBaseName, detectVariantLabel, normText } from './variantGrouping'
import { getColorSamplePath } from './productColorSamples'
import {
  isMarmoltexGroupBaseName,
  MARMOLTEX_FINISH_OPTIONS,
  marmoltexCartName,
  type MarmoltexFinish,
} from '@/lib/marmoltex-finish'

interface ProductDetailProps {
  productId: string
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const { data: session } = useSession()
  const [me, setMe] = useState<{
    customerType?: 'RETAIL' | 'WHOLESALE' | null
    wholesaleStatus?: 'PENDING' | 'APPROVED' | null
  } | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<Product[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [showCalculator, setShowCalculator] = useState(false)
  /** Solo aplica si hay foto de producto y muestra de color. */
  const [galleryMode, setGalleryMode] = useState<'product' | 'color'>('product')
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [marmoltexFinish, setMarmoltexFinish] = useState<MarmoltexFinish>('CON_GRANO')
  const { addItem } = useCart()

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    ;(async () => {
      const [res, allRes] = await Promise.all([
        fetch(`/api/products/${productId}`, { cache: 'no-store' }),
        fetch('/api/products', { cache: 'no-store' }),
      ])
      if (!res.ok || !allRes.ok) {
        if (!cancelled) {
          setProduct(null)
          setVariants([])
          setSelectedVariantId(null)
          setIsLoading(false)
        }
        return
      }
      const data = (await res.json()) as Product
      const all = (await allRes.json()) as Product[]
      if (cancelled) return
      const base = detectGroupBaseName(data.name)
      const groupVariants = base
        ? all.filter((p) => detectGroupBaseName(p.name) === base).sort((a, b) => a.id - b.id)
        : [data]
      setProduct(data)
      setVariants(groupVariants)
      setSelectedVariantId(data.id)
      setIsLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [productId, session])

  useEffect(() => {
    if (!session?.user) {
      setMe(null)
      return
    }
    let cancelled = false
    ;(async () => {
      const res = await fetch('/api/me', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (cancelled) return
      if (res.ok) {
        setMe({
          customerType: data?.user?.customerType ?? null,
          wholesaleStatus: data?.user?.wholesaleStatus ?? null,
        })
      } else {
        setMe(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    setQuantity(1)
    setMarmoltexFinish('CON_GRANO')
  }, [selectedVariantId])

  useEffect(() => {
    setGalleryMode('product')
  }, [selectedVariantId])

  useEffect(() => {
    if (!lightboxSrc) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxSrc(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxSrc])

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

  const selectedProduct = variants.find((v) => v.id === selectedVariantId) ?? product
  const availableStock = Math.max(0, selectedProduct.stock)
  // Máximo comprable por ítem: hasta el stock disponible
  const maxAllowed = availableStock

  const handleAddToCart = () => {
    if (maxAllowed <= 0) return
    const wp = (selectedProduct as Product & { wholesalePrice?: number | null }).wholesalePrice
    const groupBase = detectGroupBaseName(selectedProduct.name)
    const isMarmoltex = isMarmoltexGroupBaseName(groupBase)
    addItem(
      {
        id: selectedProduct.id,
        name: isMarmoltex
          ? marmoltexCartName(selectedProduct.name, marmoltexFinish)
          : selectedProduct.name,
        price: selectedProduct.price,
        wholesalePrice: wp ?? null,
        marmoltexFinish: isMarmoltex ? marmoltexFinish : null,
        image: selectedProduct.image ?? undefined,
        stock: selectedProduct.stock,
      },
      quantity
    )
  }

  const categoryKey: CategoryKey =
    selectedProduct.category in CATEGORY_THEME
      ? (selectedProduct.category as CategoryKey)
      : 'adhesivos'

  const theme = CATEGORY_THEME[categoryKey]
  const categoryLabel =
    categoryKey in CATEGORY_LABEL ? CATEGORY_LABEL[categoryKey] : 'Producto'

  const technicalSummary = (selectedProduct.technicalSummary ?? null) as any
  const technicalSummaryForCalculator = technicalSummary

  const variantLabels =
    variants.length > 1
      ? Array.from(
          new Set(
            variants.map((v) => detectVariantLabel(v.name, detectGroupBaseName(v.name))).filter(Boolean)
          )
        )
      : []

  function formatSpanishList(items: string[]): string {
    const clean = items.map((s) => s.trim()).filter(Boolean)
    if (clean.length === 0) return ''
    if (clean.length === 1) return clean[0]!
    if (clean.length === 2) return `${clean[0]} y ${clean[1]}`
    return `${clean.slice(0, -1).join(', ')} y ${clean[clean.length - 1]}`
  }

  const groupBase = detectGroupBaseName(selectedProduct.name)
  const showMarmoltexFinish = isMarmoltexGroupBaseName(groupBase)
  const variantLabelForGallery = detectVariantLabel(selectedProduct.name, groupBase)
  const colorSampleSrc = groupBase ? getColorSamplePath(groupBase, variantLabelForGallery) : null
  const productImageSrc = selectedProduct.image ?? ''
  const hasColorProductToggle = Boolean(colorSampleSrc && productImageSrc)
  const mainGallerySrc =
    colorSampleSrc && (!productImageSrc || galleryMode === 'color') ? colorSampleSrc : productImageSrc || colorSampleSrc

  let titleFirst: string
  let titleRest: string
  if (groupBase === 'Concreto aparente') {
    let vl = detectVariantLabel(selectedProduct.name, groupBase)
    if (normText(selectedProduct.name) === normText('Concreto aparente')) {
      vl = 'Natural'
    }
    titleFirst = 'Concreto aparente'
    titleRest = vl === 'Natural' ? 'natural' : vl
  } else {
    const titleParts = selectedProduct.name.trim().split(/\s+/).filter(Boolean)
    titleFirst = titleParts[0] ?? ''
    titleRest = titleParts.slice(1).join(' ')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
          <div className="bg-gray-50 p-4 sm:p-10 flex flex-col items-center justify-center">
            <div className="w-full flex flex-col items-center justify-center gap-4">
              {mainGallerySrc ? (
                <div className="w-full">
                  <button
                    type="button"
                    onClick={() => setLightboxSrc(mainGallerySrc)}
                    className="group relative w-full cursor-zoom-in rounded-sm border border-transparent p-0 text-left transition hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                    aria-label="Ver imagen ampliada"
                  >
                    <img
                      src={mainGallerySrc}
                      alt={
                        hasColorProductToggle && galleryMode === 'color'
                          ? `Muestra del color — ${variantLabelForGallery}`
                          : selectedProduct.name
                      }
                      className="block w-full max-w-[520px] sm:max-w-[600px] lg:max-w-[680px] max-h-[min(70vh,640px)] sm:max-h-[min(75vh,680px)] object-contain mx-auto"
                    />
                    <span className="pointer-events-none absolute bottom-3 right-3 rounded bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white opacity-0 transition group-hover:opacity-100 sm:text-xs">
                      Clic para ampliar
                    </span>
                  </button>

                  {hasColorProductToggle ? (
                    <div className="mt-4 w-full max-w-[520px] sm:max-w-[600px] lg:max-w-[680px] mx-auto">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                        Cambiar vista
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setGalleryMode('product')}
                          className={[
                            'flex items-center gap-3 border p-2 text-left transition',
                            galleryMode === 'product'
                              ? 'border-orange-500 bg-white ring-1 ring-orange-500/30'
                              : 'border-gray-200 bg-white hover:border-gray-400',
                          ].join(' ')}
                        >
                          <span className="relative h-14 w-14 shrink-0 overflow-hidden bg-white border border-gray-100">
                            {productImageSrc ? (
                              <img src={productImageSrc} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-gray-300">
                                <ImageIcon className="h-6 w-6" />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold text-black">Producto</span>
                            <span className="block text-[11px] text-gray-500">Envase / presentación</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGalleryMode('color')}
                          className={[
                            'flex items-center gap-3 border p-2 text-left transition',
                            galleryMode === 'color'
                              ? 'border-orange-500 bg-white ring-1 ring-orange-500/30'
                              : 'border-gray-200 bg-white hover:border-gray-400',
                          ].join(' ')}
                        >
                          <span className="relative h-14 w-14 shrink-0 overflow-hidden bg-gray-100 border border-gray-100">
                            {colorSampleSrc ? (
                              <img src={colorSampleSrc} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold text-black">Muestra del color</span>
                            <span className="block text-[11px] text-gray-500 truncate">{variantLabelForGallery}</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : colorSampleSrc && !productImageSrc ? (
                    <p className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-600">
                      <Palette className="h-4 w-4 shrink-0 text-orange-600" />
                      Vista: muestra del color ({variantLabelForGallery})
                    </p>
                  ) : null}
                </div>
              ) : (
                <span className="text-gray-400">Imagen del Producto</span>
              )}
            </div>
          </div>

          {/* Columna derecha: información */}
          <div className="border-t border-gray-200 lg:border-t-0 lg:border-l p-4 sm:p-10">
          <span className="text-xs text-gray-600 font-medium tracking-wider uppercase flex items-center gap-2">
            <span className={['w-2 h-2', theme.accent].join(' ')} />
            {categoryLabel}
          </span>

          <div className="mt-2 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <h1 className="text-2xl sm:text-4xl font-bold text-black tracking-tight sm:flex-1 min-w-0 leading-tight break-words">
                {titleRest ? (
                  <>
                    <span className="block">{titleFirst}</span>
                    <span className="block">{titleRest}</span>
                  </>
                ) : (
                  titleFirst
                )}
              </h1>

              <div className="flex flex-col gap-2 w-full max-w-[240px] mx-auto sm:mx-0 sm:max-w-none sm:w-[260px] shrink-0">
                {selectedProduct.technicalSheet ? (
                  <a
                    href={selectedProduct.technicalSheet}
                    download
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 bg-white text-xs sm:text-sm font-semibold hover:border-orange-500 transition-colors"
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
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 bg-gray-50 text-xs sm:text-sm font-semibold text-gray-400 cursor-not-allowed"
                    aria-label="Ficha técnica no disponible"
                    title="Ficha técnica no disponible"
                  >
                    <Download className="w-4 h-4" />
                    Descargar ficha técnica
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowCalculator(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 bg-white text-xs sm:text-sm font-semibold hover:border-orange-500 hover:bg-orange-50 transition-colors"
                  aria-label="Abrir calculadora de consumo"
                  title="Calculadora de consumo"
                >
                  <Calculator className="w-4 h-4" />
                  Calculadora de consumo
                </button>
              </div>
            </div>
          </div>
          {(() => {
            const ws = (selectedProduct as Product & { wholesalePrice?: number | null }).wholesalePrice
            const isWsUser =
              me?.customerType === 'WHOLESALE' && me?.wholesaleStatus === 'APPROVED'
            const showWs = isWsUser && ws != null && Number.isFinite(ws)
            return (
              <div className="mb-4 sm:mb-6">
                {showWs ? (
                  <>
                    <p className="text-xl sm:text-2xl font-bold text-black">
                      ${Math.floor(ws!).toLocaleString('es-MX')}{' '}
                      <span className="text-sm font-semibold text-gray-600">lista mayorista</span>
                    </p>
                    <p className="text-sm text-gray-500 line-through">
                      ${selectedProduct.price.toLocaleString('es-MX')} lista público
                    </p>
                  </>
                ) : (
                  <p className="text-xl sm:text-2xl font-bold text-black">
                    ${selectedProduct.price.toLocaleString('es-MX')}
                  </p>
                )}
              </div>
            )
          })()}

          {variants.length > 1 ? (
            <div className="mb-5">
              <select
                aria-label="Elegir color u opción"
                value={selectedVariantId ?? selectedProduct.id}
                onChange={(e) => setSelectedVariantId(Number(e.target.value))}
                className="w-full sm:max-w-sm px-3 py-2 border border-gray-200 bg-white focus:border-black transition-colors"
              >
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {detectVariantLabel(variant.name, detectGroupBaseName(variant.name))}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {showMarmoltexFinish ? (
            <div className="mb-5">
              <label
                htmlFor="marmoltex-finish"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Presentación / aplicación
              </label>
              <select
                id="marmoltex-finish"
                aria-label="Presentación Marmoltex"
                value={marmoltexFinish}
                onChange={(e) => setMarmoltexFinish(e.target.value as MarmoltexFinish)}
                className="w-full sm:max-w-sm px-3 py-2 border border-gray-200 bg-white focus:border-black transition-colors"
              >
                {MARMOLTEX_FINISH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="mb-5 sm:mb-6">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">{selectedProduct.description}</p>
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
                    {(variantLabels.length > 0 || technicalSummary.colores) && (
                      <div className="border border-gray-200 p-4">
                        <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                          Colores del producto
                        </p>
                        <p className="text-black mt-2 line-clamp-3">
                          {variantLabels.length > 0 ? formatSpanishList(variantLabels) : technicalSummary.colores}
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
              {availableStock > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={availableStock > 0 ? 'text-gray-800 font-semibold' : 'text-red-700 font-semibold'}>
                {availableStock > 0 ? `Stock disponible: ${availableStock}` : 'Sin stock'}
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

      <ConsumptionCalculatorModal
        open={showCalculator}
        onClose={() => setShowCalculator(false)}
        technicalSummary={technicalSummaryForCalculator}
      />

      {lightboxSrc ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada"
          onClick={() => setLightboxSrc(null)}
        >
          <div
            className="relative flex max-h-full max-w-full flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxSrc(null)}
              className="absolute -top-2 right-0 z-10 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 sm:-top-3"
              aria-label="Cerrar vista ampliada"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={lightboxSrc}
              alt="Vista ampliada del producto o color"
              className="max-h-[85vh] max-w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

