'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  // Parallax más suave con spring
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  const y = useTransform(smoothProgress, [0, 1], ['0%', '60%'])
  const opacity = useTransform(smoothProgress, [0, 0.6], [1, 0])
  const scale = useTransform(smoothProgress, [0, 1], [1, 0.95])

  return (
    <section 
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ marginTop: 0, paddingTop: 0 }}
    >
      {/* Imagen de fondo con parallax mejorado */}
      <motion.div
        style={{ y, scale }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-gray-100 to-gray-200">
          {/* Placeholder para imagen - aquí irá la imagen real */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-150 to-gray-100" />
          </div>
        </div>
      </motion.div>

      {/* Contenido principal con animaciones mejoradas */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 w-full"
      >
        <div className="flex items-center min-h-screen py-20 md:py-0">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-black mb-6 md:mb-8 leading-tight tracking-tight"
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
              className="mt-6 md:mt-8"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/productos"
                  className="group inline-flex items-center space-x-3 bg-white text-black px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-medium hover:bg-gray-100 transition-colors duration-300 w-full sm:w-auto justify-center"
                >
                  <span>VER PRODUCTOS</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>

      </motion.div>
    </section>
  )
}
