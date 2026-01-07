'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

interface AnimatedParagraphProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export default function AnimatedParagraph({ 
  children, 
  className = '',
  delay = 0 
}: AnimatedParagraphProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.p
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ 
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        delay: delay
      }}
    >
      {children}
    </motion.p>
  )
}

