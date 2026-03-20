'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Footer() {
  const instagramUrl = 'https://www.instagram.com/coprecubrimientosar?igsh=aXpvZ3F4d2c2cTJq'
  const facebookUrl = '' // TODO: completar cuando nos pases el link de Facebook
  const email = 'pedidoscoprecubrimientos@gmail.com'
  const addressLine1 = 'Santa Barbara 3051'
  const addressLine2 = 'X5006 Córdoba, Argentina'
  const addressQuery = `${addressLine1}, ${addressLine2}`
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`

  return (
    <footer className="bg-black text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center sm:text-left">
          {/* Company Info */}
          <div className="flex flex-col items-center sm:items-start">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="relative h-12 w-28 mb-4"
            >
              <Image
                src="/images/logocop.png"
                alt="COP - Materiales de Construcción"
                width={112}
                height={48}
                className="object-contain"
              />
            </motion.div>
            <p className="mb-6 text-gray-400 leading-relaxed">
              Revestimientos y soluciones para la construcción. Calidad y asesoramiento técnico para profesionales.
            </p>
            <div className="flex justify-center sm:justify-start space-x-4">
              <motion.a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 border border-gray-700 rounded-full flex items-center justify-center hover:border-orange-500 hover:text-orange-500 hover:bg-orange-500/10 transition-all"
                aria-label="Instagram de COP"
              >
                <Instagram className="w-5 h-5" />
              </motion.a>
              {facebookUrl ? (
                <motion.a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 border border-gray-700 rounded-full flex items-center justify-center hover:border-orange-500 hover:text-orange-500 hover:bg-orange-500/10 transition-all"
                  aria-label="Facebook de COP"
                >
                  <Facebook className="w-5 h-5" />
                </motion.a>
              ) : (
                <div
                  className="w-10 h-10 border border-gray-700 rounded-full flex items-center justify-center opacity-60 cursor-not-allowed"
                  aria-label="Facebook de COP (próximamente)"
                  title="Facebook (próximamente)"
                >
                  <Facebook className="w-5 h-5" />
                </div>
              )}
              <motion.a
                href={`mailto:${email}`}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 border border-gray-700 rounded-full flex items-center justify-center hover:border-orange-500 hover:text-orange-500 hover:bg-orange-500/10 transition-all"
                aria-label="Enviar email a COP"
              >
                <Mail className="w-5 h-5" />
              </motion.a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-6 text-lg">Enlaces Rápidos</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/productos" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/empresa" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Empresa
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-6 text-lg">Atención al Cliente</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/perfil" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Mi Cuenta
                </Link>
              </li>
              <li>
                <Link href="/pedidos" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Mis Pedidos
                </Link>
              </li>
              <li>
                <Link href="/ayuda" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Ayuda
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-6 text-lg">Contacto</h4>
            <ul className="space-y-4">
              <li>
                <motion.a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start sm:items-start justify-center sm:justify-start space-x-3 group hover:text-orange-500 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  <span className="text-gray-400 group-hover:text-orange-500 transition-colors">
                    {addressLine1}
                    <br />
                    {addressLine2}
                  </span>
                </motion.a>
              </li>
              <li>
                <motion.a
                  href="tel:+5493515900630"
                  className="flex items-center justify-center sm:justify-start space-x-3 group hover:text-orange-500 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <Phone className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  <span className="text-gray-400 group-hover:text-orange-500 transition-colors">+54 9 351 590 0630</span>
                </motion.a>
              </li>
              <li>
                <motion.a
                  href={`mailto:${email}`}
                  className="flex items-center justify-center sm:justify-start space-x-3 group hover:text-orange-500 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <Mail className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  <span className="text-gray-400 group-hover:text-orange-500 transition-colors">{email}</span>
                </motion.a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} COP. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
