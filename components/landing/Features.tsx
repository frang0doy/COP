'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { Paintbrush, Building2, CheckCircle, Sparkles } from 'lucide-react'
import AnimatedTitle from '@/components/ui/AnimatedTitle'
import AnimatedParagraph from '@/components/ui/AnimatedParagraph'

const features = [
  {
    icon: Paintbrush,
    title: 'Recubrimientos de Alta Calidad',
    description: 'Productos desarrollados con los más altos estándares para resultados duraderos.',
  },
  {
    icon: Building2,
    title: 'Para Profesionales',
    description: 'Soluciones confiables para cada proyecto de construcción en México, Argentina y Cuba.',
  },
  {
    icon: Sparkles,
    title: 'Acabados Perfectos',
    description: 'Resultados impecables que transforman cualquier espacio.',
  },
  {
    icon: CheckCircle,
    title: 'Calidad Garantizada',
    description: 'Asesoría técnica profesional para garantizar el éxito de tu obra.',
  },
]

export default function Features() {
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

  const y = useTransform(smoothProgress, [0, 1], [100, -100])
  const opacity = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])

  return (
    <section ref={ref} className="relative py-16 md:py-24 bg-gray-200 overflow-hidden">
      {/* Divider superior con animación */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-px bg-gray-300"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 bg-gray-100 -z-10"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            UN NUEVO CONCEPTO EN RECUBRIMIENTOS
          </AnimatedTitle>
          <AnimatedParagraph
            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed"
            delay={0.4}
          >
            UNA MARCA NACIDA Y RESPALDADA CON NUESTRA TRAYECTORIA
          </AnimatedParagraph>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1]
                }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <div className="bg-white p-6 md:p-8 border border-gray-200 hover:border-orange-500 transition-all duration-300 h-full cursor-pointer group-hover:shadow-lg flex flex-col items-center text-center">
                  <motion.div 
                    className="w-12 h-12 md:w-16 md:h-16 border-2 border-black rounded-full flex items-center justify-center mb-4 md:mb-6 group-hover:bg-orange-500 group-hover:border-orange-500 transition-all duration-300"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-black group-hover:text-white transition-colors duration-300" />
                  </motion.div>
                  <h3 className="text-lg md:text-xl font-semibold text-black mb-3 md:mb-4 group-hover:text-gray-700 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Divider inferior con animación */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-px bg-gray-300"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
    </section>
  )
}
