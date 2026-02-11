'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { motion } from 'framer-motion'

export default function TutorialesCopPage() {
  return (
    <main className="min-h-screen pt-24 bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-xs font-semibold tracking-[0.25em] text-gray-600 uppercase">
            Sección nueva
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-black">
            Tutoriales <span className="text-brand-orange">COP</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-700 max-w-2xl">
            Acá vas a encontrar guías, tips y tutoriales para aplicar nuestros productos y sacarles el máximo provecho.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Próximamente', desc: 'Estamos preparando el contenido.' },
              { title: 'Próximamente', desc: 'Guías paso a paso y recomendaciones.' },
              { title: 'Próximamente', desc: 'Videos y material descargable.' },
            ].map((c, i) => (
              <div key={i} className="bg-white border border-gray-200 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
                <h2 className="text-lg font-semibold text-black">{c.title}</h2>
                <p className="mt-2 text-sm text-gray-600">{c.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <Footer />
    </main>
  )
}

