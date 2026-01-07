'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import AnimatedTitle from '@/components/ui/AnimatedTitle'
import AnimatedParagraph from '@/components/ui/AnimatedParagraph'

// Datos de ejemplo - estos vendrán de la base de datos
const featuredProducts = [
  {
    id: 1,
    name: 'Adhesivo Cerámico Premium',
    category: 'ADHESIVOS',
    price: 1250,
    image: '/api/placeholder/400/300',
  },
  {
    id: 7,
    name: 'Impermeabilizante Elastómero',
    category: 'IMPERMEABILIZANTES',
    price: 3200,
    image: '/api/placeholder/400/300',
  },
  {
    id: 13,
    name: 'Revestimiento Texturado',
    category: 'REVESTIMIENTO Y REVOQUE',
    price: 1890,
    image: '/api/placeholder/400/300',
  },
]

export default function ProductsPreview() {
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

  return (
    <section ref={ref} className="relative py-16 md:py-32 bg-gray-100">
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
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ 
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="text-center mb-16"
        >
          <AnimatedTitle
            as="h2"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6 tracking-tight leading-tight"
            delay={0.2}
          >
            RECUBRIMIENTOS PENSADOS PARA UN RENDIMIENTO SUPERIOR EN OBRA
          </AnimatedTitle>
          <AnimatedParagraph
            className="text-lg md:text-xl text-gray-600 mb-8 font-light leading-relaxed max-w-3xl mx-auto"
            delay={0.4}
          >
            Conocé nuestra amplia gama de pinturas y revestimientos profesionales para la construcción.
          </AnimatedParagraph>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link
              href="/productos"
              className="inline-flex items-center space-x-3 text-black hover:text-gray-600 font-medium group transition-colors"
            >
              <span>VER CATÁLOGO</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {featuredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.15,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{ y: -4 }}
              className="group cursor-pointer"
            >
              <Link href={`/productos/${product.id}`}>
                <div className="bg-white border border-gray-200 overflow-hidden hover:border-black transition-all duration-300 hover:shadow-lg">
                  {/* Imagen del producto - aquí irá la imagen real con color */}
                  <div className="relative h-64 md:h-80 bg-gray-100 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 group-hover:from-gray-300 group-hover:to-gray-200 transition-all duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                      Imagen del Producto
                    </div>
                  </div>
                  <div className="p-4 md:p-6">
                    <span className="text-xs text-gray-500 font-medium tracking-wider uppercase block mb-2 md:mb-3">
                      {product.category}
                    </span>
                    <h3 className="text-lg md:text-xl font-semibold text-black mb-3 md:mb-4 group-hover:text-gray-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xl md:text-2xl font-bold text-black">
                        ${product.price.toLocaleString('es-MX')}
                      </span>
                      <span className="text-black inline-flex items-center group-hover:translate-x-2 transition-transform">
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
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
