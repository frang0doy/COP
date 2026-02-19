'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import Link from 'next/link'
import { Download } from 'lucide-react'
import AnimatedTitle from '@/components/ui/AnimatedTitle'
import AnimatedParagraph from '@/components/ui/AnimatedParagraph'

export default function CTA() {
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

  const y = useTransform(smoothProgress, [0, 1], [0, -50])
  const opacity = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])

  return (
    <section ref={ref} className="relative py-16 md:py-24 bg-gray-100 overflow-hidden">
      {/* Divider superior con animación */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-px bg-gray-200"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      />
      
      <motion.div
        style={{ y }}
        className="absolute inset-0 bg-gray-50 -z-10"
      />

      <motion.div
        style={{ opacity }}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ 
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <AnimatedTitle
            as="h2"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6 tracking-tight leading-tight"
            delay={0.2}
          >
            ¿LISTO PARA COMENZAR TU PROYECTO?
          </AnimatedTitle>
          <AnimatedParagraph
            className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto font-light leading-relaxed"
            delay={0.4}
          >
            Descubre nuestra amplia gama de productos de construcción y encuentra todo lo que necesitas en un solo lugar.
          </AnimatedParagraph>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-auto">
              <a
                href="/documents/fichas-tecnicas/catalogoCOP.pdf"
                download
                className="group bg-orange-500 text-white px-6 md:px-10 py-3 md:py-4 text-sm md:text-base font-medium border border-orange-500 hover:bg-orange-600 hover:border-orange-600 transition-colors duration-300 inline-flex items-center justify-center space-x-3 w-auto"
              >
                <span>DESCARGAR CATÁLOGO</span>
                <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </a>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-auto">
              <Link
                href="/contacto"
                className="bg-orange-500 text-white px-6 md:px-10 py-3 md:py-4 text-sm md:text-base font-medium border border-orange-500 hover:bg-orange-600 hover:border-orange-600 transition-colors duration-300 w-auto text-center inline-flex items-center justify-center"
              >
                CONTACTAR ASESOR
              </Link>
            </motion.div>
          </div>
        </motion.div>
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
