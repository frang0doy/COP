'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import AnimatedTitle from '@/components/ui/AnimatedTitle'
import AnimatedParagraph from '@/components/ui/AnimatedParagraph'

type Props = {
  /** Ruta dentro de /public, ej: "/videos/albanileria.mp4" */
  src?: string
}

export default function VideoShowcase({
  src = '/videos/albanileria.mp4',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, -80])
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0])

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-24 bg-black text-white overflow-hidden"
      aria-label="Video"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gray-800" />

      <motion.div style={{ y }} className="absolute inset-0 bg-black -z-10" />

      <motion.div style={{ opacity }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 md:mb-14"
        >
          <AnimatedTitle
            as="h2"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 tracking-tight leading-tight"
            delay={0.2}
          >
            NUESTRO TRABAJO EN ACCIÓN
          </AnimatedTitle>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-120px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative mx-auto max-w-6xl"
        >
          <div className="relative overflow-hidden border border-white/10 bg-black">
            <div className="aspect-video w-full">
              <video
                className="h-full w-full object-cover"
                src={src}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-800" />
    </section>
  )
}

