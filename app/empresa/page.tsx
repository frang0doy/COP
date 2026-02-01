'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AnimatedTitle from '@/components/ui/AnimatedTitle'
import AnimatedParagraph from '@/components/ui/AnimatedParagraph'
import { Mail, Phone, Clock, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

export default function EmpresaPage() {
  const addressLine1 = `31°26'41.6"S 64°05'43.4"W`
  const addressLine2 = 'Córdoba, Argentina'

  return (
    <main className="min-h-screen pt-24 bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="max-w-4xl mb-12 md:mb-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-black mb-8 md:mb-12 leading-tight tracking-tight">
            <AnimatedTitle
              as="span"
              className=""
              delay={0.2}
            >
              SOMOS
            </AnimatedTitle>
            {' '}
            <AnimatedTitle
              as="span"
              className="text-brand-orange"
              delay={0.5}
            >
              COP
            </AnimatedTitle>
          </h1>
          
          <div className="space-y-6 md:space-y-8">
            <AnimatedParagraph
              className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed"
              delay={0.4}
            >
              En <span className="text-brand-orange font-semibold">COP</span> creamos revestimientos decorativos innovadores para brindar la calidad y espíritu que cada proyecto merece.
            </AnimatedParagraph>
            
            <AnimatedParagraph
              className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed"
              delay={0.6}
            >
              Buscamos convertirnos en el referente de confianza de cada cliente que nos elige, mediante la honestidad y calidad de servicio que nos define.
            </AnimatedParagraph>
          </div>
        </div>

        {/* Información de contacto y mapa */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20"
        >
          {/* Información de contacto */}
          <div className="space-y-8">
            <motion.a
              href="https://www.google.com/maps/place/31%C2%B026'41.6%22S+64%C2%B005'43.4%22W/@-31.4468143,-64.1124865,14.66z/data=!4m4!3m3!8m2!3d-31.4449!4d-64.0954?entry=ttu&g_ep=EgoyMDI2MDEwNy4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start space-x-3 md:space-x-4 group hover:text-brand-orange transition-colors cursor-pointer"
              whileHover={{ x: 4 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-brand-orange transition-colors">
                <MapPin className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base text-black group-hover:text-brand-orange transition-colors mb-1">Dirección</p>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                  {addressLine1}
                  <br />
                  {addressLine2}
                </p>
              </div>
            </motion.a>

            <motion.a
              href="mailto:pedidoscoprecubrimientos@gmail.com"
              className="flex items-start space-x-3 md:space-x-4 group hover:text-brand-orange transition-colors cursor-pointer"
              whileHover={{ x: 4 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-brand-orange transition-colors">
                <Mail className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base text-black group-hover:text-brand-orange transition-colors mb-1">Email</p>
                <p className="text-sm md:text-base text-gray-700 break-all">pedidoscoprecubrimientos@gmail.com</p>
              </div>
            </motion.a>

            <motion.a
              href="tel:+5493515900630"
              className="flex items-start space-x-3 md:space-x-4 group hover:text-brand-orange transition-colors cursor-pointer"
              whileHover={{ x: 4 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-brand-orange transition-colors">
                <Phone className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base text-black group-hover:text-brand-orange transition-colors mb-1">Teléfono</p>
                <p className="text-sm md:text-base text-gray-700">+54 9 351 590 0630</p>
              </div>
            </motion.a>

            <div className="flex items-start space-x-3 md:space-x-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base text-black mb-1">Horario de Atención</p>
                <p className="text-sm md:text-base text-gray-700">08:00hs a 16:30hs</p>
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="h-full min-h-[400px] md:min-h-[500px] rounded-lg overflow-hidden shadow-lg border border-gray-200 order-1 lg:order-2">
            <iframe
              src="https://www.google.com/maps?q=-31.4449,-64.0954&hl=es&z=16&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
              title="Ubicación COP"
            />
          </div>
        </motion.div>
      </div>
      <Footer />
    </main>
  )
}
