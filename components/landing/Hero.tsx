'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, PanInfo, useMotionValue, animate } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

const images = [
  '/images/cop3.png',
  '/images/cop2.png',
  '/images/cop8.png',
  '/images/cop5.png',
]

const SLIDE_DURATION = 5000 // 5 segundos por slide

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const x = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // Removemos el parallax de las imágenes - deben quedarse fijas
  const contentOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 0.3], [0, -30])

  // Calcular constraints del drag basado en el viewport
  const [dragConstraints, setDragConstraints] = useState({ left: -1920, right: 0 })

  useEffect(() => {
    const updateConstraints = () => {
      if (typeof window === 'undefined') return
      const viewportWidth = window.innerWidth
      setDragConstraints({
        left: -((images.length - 1) * viewportWidth),
        right: 0
      })
    }

    updateConstraints()
    window.addEventListener('resize', updateConstraints)
    return () => window.removeEventListener('resize', updateConstraints)
  }, [])

  // Auto-play del slider
  useEffect(() => {
    if (isDragging) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
      setProgress(0)
    }, SLIDE_DURATION)

    return () => clearInterval(interval)
  }, [isDragging])

  // Progress bar animation
  useEffect(() => {
    if (isDragging) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      return
    }

    setProgress(0)
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0
        }
        return prev + (100 / (SLIDE_DURATION / 100))
      })
    }, 100)

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [currentIndex, isDragging])

  // Animar el cambio de slide
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const viewportWidth = window.innerWidth
    const targetX = -(currentIndex * viewportWidth)
    
    const controls = animate(x, targetX, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    })
    return controls.stop
  }, [currentIndex, x])

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    const threshold = 100

    // Permitir ir hacia atrás o adelante con loop
    if (info.offset.x > threshold) {
      // Arrastró hacia la derecha - ir a slide anterior
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      } else {
        // Si está en el primero, ir al último (loop)
        setCurrentIndex(images.length - 1)
      }
    } else if (info.offset.x < -threshold) {
      // Arrastró hacia la izquierda - ir a slide siguiente
      if (currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // Si está en el último, ir al primero (loop)
        setCurrentIndex(0)
      }
    } else {
      // No se movió lo suficiente - volver a la posición actual
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
      const targetX = -(currentIndex * viewportWidth)
      animate(x, targetX, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      })
    }
    setProgress(0)
  }

  const handleDragStart = () => {
    setIsDragging(true)
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setProgress(0)
  }

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ marginTop: 0, paddingTop: 0 }}
    >
      {/* Slider de imágenes - sin parallax, fijas */}
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full overflow-hidden">
          <motion.div
            ref={containerRef}
            drag="x"
            dragConstraints={dragConstraints}
            dragElastic={0.1}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            style={{ 
              x,
              display: 'flex',
              width: `${images.length * 100}vw`,
              height: '100%',
            }}
            className="relative h-full flex cursor-grab active:cursor-grabbing"
          >
            {images.map((image, index) => (
              <div
                key={index}
                className="relative flex-shrink-0"
                style={{ 
                  width: '100vw',
                  height: '100%',
                }}
              >
                <Image
                  src={image}
                  alt={`Slide ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Contenido principal */}
      <motion.div 
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-10 w-full"
      >
        <div className="flex items-center min-h-screen py-20 md:py-0">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-white mb-6 md:mb-8 leading-tight tracking-tight drop-shadow-lg text-center sm:text-left"
            >
              {["Somos tu mejor", "aliado en", "construcción"].map((line, lineIndex) => (
                <motion.span 
                  key={lineIndex}
                  className="block overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.01 }}
                >
                  {line.split("").map((char, charIndex) => (
                    <motion.span
                      key={charIndex}
                      className="inline-block"
                      initial={{ y: 150, opacity: 0, scale: 0.5 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ 
                        duration: 0.5,
                        ease: [0.16, 1, 0.3, 1],
                        delay: lineIndex * 0.3 + charIndex * 0.03
                      }}
                    >
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  ))}
                </motion.span>
              ))}
            </motion.h1>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.9
              }}
              className="mt-6 md:mt-8 flex justify-center sm:justify-start"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/productos"
                  className="group inline-flex items-center space-x-3 bg-orange-500 text-white px-5 py-2.5 md:px-7 md:py-3.5 text-sm md:text-base font-medium border border-orange-500 hover:bg-orange-600 hover:border-orange-600 transition-colors duration-300 justify-center w-auto"
                >
                  <span>VER PRODUCTOS</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Indicadores con progress bar */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex items-center space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="relative w-8 h-8 flex items-center justify-center group"
            aria-label={`Ir a slide ${index + 1}`}
          >
            {/* Círculo exterior */}
            <svg
              className="w-8 h-8 transform -rotate-90"
              viewBox="0 0 32 32"
            >
              {/* Círculo de fondo (gris claro) */}
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1.5"
              />
              {/* Progress bar (naranja) */}
              {index === currentIndex ? (
                <motion.circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="var(--brand-orange)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progress / 100 }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                />
              ) : (
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="var(--brand-orange)"
                  strokeWidth="1.5"
                  strokeDasharray={`${index < currentIndex ? 87.96 : 0} 87.96`}
                />
              )}
            </svg>
            {/* Círculo interior (negro sólido) */}
            <div
              className={`absolute w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-black scale-125' : 'bg-black/50 group-hover:bg-black/75'
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
