'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

interface AnimatedTitleProps {
  children: string
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span'
  delay?: number
}

export default function AnimatedTitle({ 
  children, 
  className = '', 
  as: Component = 'h2',
  delay = 0 
}: AnimatedTitleProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  // Dividir el texto en palabras para crear líneas naturales
  const words = children.split(' ')

  return (
    <Component ref={ref} className={className}>
      {words.map((word, wordIndex) => (
        <motion.span
          key={wordIndex}
          className="inline-block overflow-hidden"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.01 }}
        >
          {word.split('').map((char, charIndex) => (
            <motion.span
              key={charIndex}
              className="inline-block"
              initial={{ y: 150, opacity: 0, scale: 0.5 }}
              animate={isInView ? { y: 0, opacity: 1, scale: 1 } : { y: 150, opacity: 0, scale: 0.5 }}
              transition={{ 
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
                delay: delay + wordIndex * 0.1 + charIndex * 0.03
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
          {wordIndex < words.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </Component>
  )
}

