'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react'
import AnimatedTitle from '@/components/ui/AnimatedTitle'
import AnimatedParagraph from '@/components/ui/AnimatedParagraph'

const testimonials = [
  {
    name: 'Martín Gómez',
    role: 'Arquitecto',
    text: 'Utilizamos los revestimientos de COP en varios proyectos de obra nueva y la calidad superó nuestras expectativas. Excelente adherencia y terminación, incluso en condiciones climáticas exigentes.',
  },
  {
    name: 'Laura Rivas',
    role: 'Lucy\'s House',
    text: 'Nos acompañaron en el asesoramiento técnico en todo el proceso de aplicación. Sus pinturas mostraron gran rendimiento y una durabilidad notable, aspectos fundamentales para el tipo de obras que manejamos.',
  },
  {
    name: 'Javier Paredes',
    role: 'Aplicador',
    text: 'Los elegimos para el revestimiento exterior de un complejo de viviendas. El producto ofreció una excelente cobertura y resistencia, logrando un acabado estético y funcional que el cliente valoró mucho.',
  },
  {
    name: 'Agustín Torres',
    role: 'Arquitecto',
    text: 'Con los impermeabilizantes logramos resolver problemas complejos en terrazas y fachadas. La facilidad de aplicación y la asesoría que recibimos fueron clave para garantizar un trabajo de calidad.',
  },
  {
    name: 'Marcos Lozada',
    role: 'DYCSA',
    text: 'Trabajar con productos COP nos brinda la tranquilidad de ofrecer a nuestros clientes materiales confiables y de alto rendimiento. El respaldo técnico y la innovación en sus formulaciones son diferenciales reales en obra.',
  },
]

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [windowWidth, setWindowWidth] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-rotación del carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isTransitioning) {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [isTransitioning])

  const goToPrevious = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    setTimeout(() => setIsTransitioning(false), 600)
  }

  const goToNext = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    setTimeout(() => setIsTransitioning(false), 600)
  }

  const goToIndex = (index: number) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 600)
  }

  return (
    <section ref={ref} className="relative py-16 md:py-24 bg-black text-white overflow-hidden">
      {/* Divider superior */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gray-800" />
      
      <motion.div
        style={{ y }}
        className="absolute inset-0 bg-gray-900 -z-10"
      />

      <motion.div
        style={{ opacity }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-16"
        >
          <AnimatedTitle
            as="h2"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 tracking-tight leading-tight"
            delay={0.2}
          >
            LO QUE DICEN NUESTROS CLIENTES
          </AnimatedTitle>
          <AnimatedParagraph
            className="text-base md:text-lg lg:text-xl text-gray-400 font-light leading-relaxed"
            delay={0.4}
          >
            Profesionales que confían en COP para sus proyectos
          </AnimatedParagraph>
        </motion.div>

        {/* Carrusel con card siempre centrada */}
        <div className="relative">
          <div className="overflow-hidden px-4 md:px-0">
            <div className="flex items-center justify-center relative" style={{ minHeight: typeof window !== 'undefined' && window.innerWidth < 640 ? '400px' : '500px' }}>
              <motion.div
                className="flex items-center gap-4 md:gap-6"
                animate={{
                  x: windowWidth < 640 
                    ? `calc(50% - 8.75rem - ${currentIndex * 17.5}rem)`
                    : windowWidth < 768
                    ? `calc(50% - 10rem - ${currentIndex * 20}rem)`
                    : `calc(50% - 12rem - ${currentIndex * 25.5}rem)`,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              >
                {testimonials.map((testimonial, index) => {
                  const isActive = index === currentIndex
                  const prevIndex = (currentIndex - 1 + testimonials.length) % testimonials.length
                  const nextIndex = (currentIndex + 1) % testimonials.length
                  const isPrev = index === prevIndex
                  const isNext = index === nextIndex
                  const isVisible = isActive || isPrev || isNext

                  return (
                    <motion.div
                      key={index}
                      className="flex-shrink-0 w-[280px] sm:w-80 md:w-96 px-2"
                      animate={{
                        scale: isActive ? 1 : isVisible ? 0.85 : 0.7,
                        opacity: isActive ? 1 : isVisible ? 0.5 : 0.2,
                        zIndex: isActive ? 20 : isVisible ? 10 : 1,
                      }}
                      transition={{
                        duration: 0.6,
                      }}
                      onClick={() => {
                        if (!isActive && isVisible) {
                          if (isPrev) goToPrevious()
                          if (isNext) goToNext()
                        }
                      }}
                      style={{ cursor: isActive ? 'default' : isVisible ? 'pointer' : 'default' }}
                    >
                      <div className={`bg-gray-900 border transition-all duration-300 h-full flex flex-col justify-between ${
                        isActive 
                          ? 'border-white p-6 md:p-8' 
                          : 'border-gray-800 p-4 md:p-6 hover:border-gray-700'
                      }`}>
                        <Quote className={`w-6 h-6 md:w-8 md:h-8 mb-4 md:mb-6 opacity-50 flex-shrink-0`} />
                        <p className={`text-gray-300 mb-4 md:mb-6 leading-relaxed italic flex-1 ${
                          isActive ? 'text-sm md:text-base' : 'text-xs md:text-sm'
                        }`}>
                          "{testimonial.text}"
                        </p>
                        <div className="border-t border-gray-800 pt-3 md:pt-4">
                          <div className={`font-semibold text-white ${isActive ? 'text-base md:text-lg' : 'text-sm md:text-base'}`}>
                            {testimonial.name}
                          </div>
                          <div className="text-xs md:text-sm text-gray-400 mt-1">{testimonial.role}</div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-center gap-3 md:gap-4 mt-8 md:mt-12">
            <button
              onClick={goToPrevious}
              disabled={isTransitioning}
              className="w-10 h-10 md:w-12 md:h-12 border-2 border-white flex items-center justify-center hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Testimonio anterior"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* Indicadores */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToIndex(index)}
                  disabled={isTransitioning}
                  className={`h-2 transition-all duration-300 ${
                    index === currentIndex 
                      ? 'w-6 md:w-8 bg-white' 
                      : 'w-2 bg-gray-600 hover:bg-gray-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-label={`Ir al testimonio ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              disabled={isTransitioning}
              className="w-10 h-10 md:w-12 md:h-12 border-2 border-white flex items-center justify-center hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Siguiente testimonio"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Divider inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-800" />
    </section>
  )
}
