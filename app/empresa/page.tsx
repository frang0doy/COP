'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AnimatedTitle from '@/components/ui/AnimatedTitle'
import AnimatedParagraph from '@/components/ui/AnimatedParagraph'
import { Mail, Phone, Clock, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

export default function EmpresaPage() {
  return (
    <main className="min-h-screen pt-24 bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="max-w-4xl mb-12 md:mb-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-black mb-8 md:mb-12 leading-tight tracking-tight">
            <AnimatedTitle
              as="span"
              className=""
              delay={0.2}
            >
              Somos
            </AnimatedTitle>
            {' '}
            <AnimatedTitle
              as="span"
              className="text-orange-500"
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
              En <span className="text-orange-500 font-semibold">COP</span> creamos revestimientos decorativos innovadores para brindar la calidad y espíritu que cada proyecto merece.
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
              href="https://maps.google.com/?q=Sta.+Bárbara,+X5006+Córdoba,+Argentina"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start space-x-3 md:space-x-4 group hover:text-orange-500 transition-colors cursor-pointer"
              whileHover={{ x: 4 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500 transition-colors">
                <MapPin className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base text-black group-hover:text-orange-500 transition-colors mb-1">Dirección</p>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                  Sta. Bárbara, X5006<br />
                  Córdoba, Argentina
                </p>
              </div>
            </motion.a>

            <motion.a
              href="mailto:infocoprecubrimientos@gmail.com"
              className="flex items-start space-x-3 md:space-x-4 group hover:text-orange-500 transition-colors cursor-pointer"
              whileHover={{ x: 4 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500 transition-colors">
                <Mail className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base text-black group-hover:text-orange-500 transition-colors mb-1">Email</p>
                <p className="text-sm md:text-base text-gray-700 break-all">infocoprecubrimientos@gmail.com</p>
              </div>
            </motion.a>

            <motion.a
              href="tel:+543515900630"
              className="flex items-start space-x-3 md:space-x-4 group hover:text-orange-500 transition-colors cursor-pointer"
              whileHover={{ x: 4 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500 transition-colors">
                <Phone className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base text-black group-hover:text-orange-500 transition-colors mb-1">Teléfono</p>
                <p className="text-sm md:text-base text-gray-700">351 590 0630</p>
              </div>
            </motion.a>

            <div className="flex items-start space-x-3 md:space-x-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base text-black mb-1">Horario de Atención</p>
                <p className="text-sm md:text-base text-gray-700">Lunes a viernes de 8 a 13 y de 14 a 17 hs</p>
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="h-full min-h-[400px] md:min-h-[500px] rounded-lg overflow-hidden shadow-lg border border-gray-200 order-1 lg:order-2">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3404.5!2d-64.2!3d-31.4!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDI0JzAwLjAiUyA2NMKwMTInMDAuMCJX!5e0!3m2!1ses!2sar!4v1234567890&q=Sta.+Bárbara,+X5006+Córdoba,+Argentina"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
              title="Ubicación COP - Santa Bárbara 3051, Camino Villa Posse, Córdoba Capital"
            />
          </div>
        </motion.div>
      </div>
      <Footer />
    </main>
  )
}
