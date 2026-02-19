'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, PanInfo } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import AnimatedTitle from '@/components/ui/AnimatedTitle'
import AnimatedParagraph from '@/components/ui/AnimatedParagraph'

// Productos destacados para el carrusel en la página de inicio
const featuredProducts = [
  {
    id: 1,
    name: 'Adhesivo Cerámico Premium',
    category: 'ADHESIVOS',
    price: 1250,
    image: '/images/products/producto1.png',
  },
  {
    id: 2,
    name: 'Adhesivo Flex',
    category: 'ADHESIVOS',
    price: 1450,
    image: '/images/products/producto2.png',
  },
  {
    id: 3,
    name: 'Adhesivo Rápido',
    category: 'ADHESIVOS',
    price: 1680,
    image: '/images/products/producto3.png',
  },
  {
    id: 4,
    name: 'Estucado Acrílico',
    category: 'ESTUCADOS',
    price: 1890,
    image: '/images/products/producto4.png',
  },
  {
    id: 5,
    name: 'Estucado Texturado',
    category: 'ESTUCADOS',
    price: 2150,
    image: '/images/products/producto5.png',
  },
  {
    id: 6,
    name: 'Estucado Liso',
    category: 'ESTUCADOS',
    price: 1750,
    image: '/images/products/producto6.png',
  },
]

export default function ProductsPreview() {
  const [currentIndex, setCurrentIndex] = useState(featuredProducts.length)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  const opacity = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])

  // Duplicar productos para crear loop infinito
  const duplicatedProducts = [...featuredProducts, ...featuredProducts, ...featuredProducts]
  const [itemsPerView, setItemsPerView] = useState(2)
  const totalItems = featuredProducts.length
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [disableAnimation, setDisableAnimation] = useState(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const SLIDE_DURATION = 4000

  // Ajustar cuántos productos se ven por vista (para que se vean más grandes)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateItemsPerView = () => {
      const w = window.innerWidth
      if (w < 640) setItemsPerView(1) // mobile
      else if (w < 1024) setItemsPerView(2) // tablet
      else setItemsPerView(3) // desktop (más ancho, entran 3)
    }

    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    return () => window.removeEventListener('resize', updateItemsPerView)
  }, [])

  // Auto-play del carrusel infinito continuo
  useEffect(() => {
    if (!isAutoPlaying || isDragging) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => prev + 1)
    }, SLIDE_DURATION)

    return () => clearInterval(interval)
  }, [isAutoPlaying, isDragging])

  // Progreso para los puntitos (similar al Hero, pero chiquito)
  useEffect(() => {
    if (!isAutoPlaying || isDragging) {
      setProgress(0)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      return
    }

    setProgress(0)
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0
        return prev + (100 / (SLIDE_DURATION / 100))
      })
    }, 100)

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [currentIndex, isAutoPlaying, isDragging])

  // Normalizar índice para loop infinito (sin salto visual) y desactivar animación 1 frame en el reset
  useEffect(() => {
    if (isDragging) return

    // Si nos pasamos hacia adelante (tercer bloque), volver al bloque del medio
    if (currentIndex >= totalItems * 2) {
      const normalized = currentIndex - totalItems
      setDisableAnimation(true)
      setCurrentIndex(normalized)
      const t = setTimeout(() => setDisableAnimation(false), 0)
      return () => clearTimeout(t)
    }

    // Si nos pasamos hacia atrás (primer bloque), volver al bloque del medio
    if (currentIndex < totalItems) {
      const normalized = currentIndex + totalItems
      setDisableAnimation(true)
      setCurrentIndex(normalized)
      const t = setTimeout(() => setDisableAnimation(false), 0)
      return () => clearTimeout(t)
    }
  }, [currentIndex, totalItems, isDragging])

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    const threshold = 50
    if (info.offset.x > threshold) setCurrentIndex((prev) => prev - 1)
    else if (info.offset.x < -threshold) setCurrentIndex((prev) => prev + 1)

    setProgress(0)
    setIsAutoPlaying(true)
  }

  const activeDotIndex = ((currentIndex - totalItems) % totalItems + totalItems) % totalItems
  const goToProduct = (index: number) => {
    setProgress(0)
    setCurrentIndex(totalItems + index)
    setIsAutoPlaying(true)
  }

  return (
    <section
      ref={ref}
      className="relative pt-4 md:pt-6 pb-8 md:pb-12 bg-gray-100"
      style={{ zIndex: 1 }}
    >
      {/* Divider superior con animación */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-px bg-gray-200"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      />
      
      <motion.div
        style={{ opacity }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-6 lg:gap-6 items-center">
          {/* Texto a la izquierda */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ 
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="space-y-1 py-4 text-center sm:text-left"
          >
            <AnimatedTitle
              as="h2"
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-1 tracking-tight leading-tight"
              delay={0.2}
            >
              RECUBRIMIENTOS DE ALTA CALIDAD
            </AnimatedTitle>
            <AnimatedParagraph
              className="text-base md:text-lg text-gray-600 font-light leading-relaxed mb-10 sm:mb-14"
              delay={0.4}
            >
              Productos profesionales para la construcción.
            </AnimatedParagraph>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="pt-4 flex justify-center sm:justify-start"
            >
              <Link
                href="/productos"
                className="group inline-flex items-center space-x-3 bg-orange-500 text-white px-5 py-2.5 sm:px-6 sm:py-3 text-sm md:text-base font-semibold border border-orange-500 hover:bg-orange-600 hover:border-orange-600 transition-colors duration-300 w-auto"
              >
                <span>VER CATÁLOGO</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Carrusel de productos a la derecha */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ 
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.2
            }}
            className="relative w-full"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => {
              if (!isDragging) {
                setIsAutoPlaying(true)
              }
            }}
          >
            <div className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing py-3 sm:py-4 md:py-6">
              <motion.div
                ref={carouselRef}
                className="flex items-center"
                drag="x"
                dragElastic={0.2}
                dragMomentum={false}
                onDragStart={() => {
                  setIsDragging(true)
                  setIsAutoPlaying(false)
                }}
                onDragEnd={handleDragEnd}
                animate={{
                  x: `-${currentIndex * (100 / duplicatedProducts.length)}%`,
                }}
                transition={{
                  type: disableAnimation ? 'tween' : 'spring',
                  stiffness: 300,
                  damping: 30,
                  duration: disableAnimation ? 0 : undefined,
                }}
                style={{
                  width: `${(duplicatedProducts.length / itemsPerView) * 100}%`,
                }}
              >
                {duplicatedProducts.map((product, index) => (
                  <div
                    key={`${product.id}-${index}`}
                    className="flex-shrink-0 flex justify-center items-center px-1 sm:px-2 md:px-3"
                    style={{
                      width: `${100 / duplicatedProducts.length}%`,
                    }}
                  >
                    {/* Imagen del producto - MUY GRANDE Y CENTRADA */}
                    {product.image ? (
                      <div className="relative w-full h-[240px] sm:h-[390px] md:h-[480px] lg:h-[560px] overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          // Escalamos el contenido para que la bolsa se vea más grande y sin "caja" de shadow
                          className="object-contain transition-transform duration-300 scale-100 sm:scale-[1.15] md:scale-[1.22] lg:scale-[1.28]"
                          sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 90vw"
                          priority={index < 3}
                          unoptimized
                          draggable={false}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">Imagen del producto</span>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Puntitos indicadores (chiquitos) */}
            <div className="mt-2 flex justify-center">
              <div className="flex items-center gap-1.5">
                {featuredProducts.map((_, idx) => {
                  const isActive = idx === activeDotIndex
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => goToProduct(idx)}
                      aria-label={`Ir al producto ${idx + 1}`}
                      className="relative w-4 h-4 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 -rotate-90" viewBox="0 0 16 16">
                        <circle
                          cx="8"
                          cy="8"
                          r="6"
                          fill="none"
                          stroke="rgba(249, 115, 22, 0.25)"
                          strokeWidth="1"
                        />
                        {isActive ? (
                          <motion.circle
                            cx="8"
                            cy="8"
                            r="6"
                            fill="none"
                            stroke="var(--brand-orange)"
                            strokeWidth="1"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: progress / 100 }}
                            transition={{ duration: 0.1, ease: 'linear' }}
                          />
                        ) : null}
                      </svg>
                      <span
                        className={[
                          'absolute w-1.5 h-1.5 rounded-full transition-colors',
                          isActive ? 'bg-black' : 'bg-black/35 hover:bg-black/55',
                        ].join(' ')}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Divider inferior con animación */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-px bg-gray-200"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
    </section>
  )
}
