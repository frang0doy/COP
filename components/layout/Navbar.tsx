'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const { itemsCount } = useCart()
  
  // Detectar si estamos en la página de inicio
  const isHomePage = pathname === '/'

  useEffect(() => {
    // Si no estamos en la página de inicio, el header siempre es negro
    if (!isHomePage) {
      setScrolled(true)
      return
    }

    const handleScroll = () => {
      // Cambiar a negro más temprano (aproximadamente 50% del viewport)
      setScrolled(window.scrollY > window.innerHeight * 0.5)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHomePage])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ 
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`fixed top-0 w-full z-50 transition-all duration-700 ease-in-out ${
        scrolled ? 'bg-black/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative h-10 w-24 md:h-16 md:w-40 flex items-center justify-center">
              <Image
                src="/images/logocop.png"
                alt="COP - Materiales de Construcción"
                width={160}
                height={64}
                className="object-contain drop-shadow-lg"
                priority
                unoptimized
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`transition-colors relative group ${
                scrolled ? 'text-white/80 hover:text-white' : 'text-white/90 hover:text-white drop-shadow-lg'
              }`}
            >
              Inicio
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/productos"
              className={`transition-colors relative group ${
                scrolled ? 'text-white/80 hover:text-white' : 'text-white/90 hover:text-white drop-shadow-lg'
              }`}
            >
              Productos
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/empresa"
              className={`transition-colors relative group ${
                scrolled ? 'text-white/80 hover:text-white' : 'text-white/90 hover:text-white drop-shadow-lg'
              }`}
            >
              Empresa
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/contacto"
              className={`transition-colors relative group ${
                scrolled ? 'text-white/80 hover:text-white' : 'text-white/90 hover:text-white drop-shadow-lg'
              }`}
            >
              Contacto
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" />
            </Link>

            {/* Cart */}
            <Link href="/carrito" className="relative group">
              <ShoppingCart className={`w-6 h-6 transition-colors drop-shadow-lg ${
                scrolled ? 'text-white/80 group-hover:text-white' : 'text-white/90 group-hover:text-white'
              }`} />
              {itemsCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
                >
                  {itemsCount}
                </motion.span>
              )}
            </Link>

            {/* User Menu */}
            {session ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/perfil"
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>{session.user?.name || 'Mi Perfil'}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="bg-white text-black px-6 py-2 hover:bg-gray-100 transition-colors font-semibold"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white/80 hover:text-white transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black border-t border-white/10"
          >
            <div className="px-4 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                Inicio
              </Link>
              <Link
                href="/productos"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                Productos
              </Link>
              <Link
                href="/empresa"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                Empresa
              </Link>
              <Link
                href="/contacto"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                Contacto
              </Link>
              <Link
                href="/carrito"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded flex items-center justify-between transition-colors"
              >
                <span>Carrito</span>
                {itemsCount > 0 && (
                  <span className="bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {itemsCount}
                  </span>
                )}
              </Link>
              {session ? (
                <>
                  <Link
                    href="/perfil"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                  >
                    Mi Perfil
                  </Link>
                  <button
                    onClick={() => {
                      signOut()
                      setIsOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                  >
                    Salir
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 bg-white text-black rounded text-center transition-colors font-semibold"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
