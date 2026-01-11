'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const { itemsCount } = useCart()
  const menuRef = useRef<HTMLDivElement | null>(null)
  
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

  // Cerrar menú al navegar/cambiar ruta
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Cerrar menú con click afuera / Escape
  useEffect(() => {
    if (!isMenuOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [isMenuOpen])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ 
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`fixed top-0 w-full z-50 transition-all duration-700 ease-in-out ${
        scrolled || isMenuOpen ? 'bg-black/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
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

          {/* Acciones (mantener logo + carrito + iniciar sesión). El resto se mueve al menú. */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Menú (nuevo) */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                className={[
                  'inline-flex h-10 items-center gap-2 px-4 border font-semibold transition-all',
                  scrolled
                    ? 'border-white/15 bg-white/5 text-white hover:bg-white/10'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/15 drop-shadow-lg',
                ].join(' ')}
              >
                <Menu className="w-4 h-4" />
                Menú
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    {/* Backdrop suave */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[90] bg-black/30"
                      onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Panel */}
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 mt-3 w-[min(92vw,420px)] z-[100]"
                      role="menu"
                    >
                      <div className="bg-black/95 border border-white/10 shadow-2xl overflow-hidden">
                        <div className="p-5">
                          <p className="text-xs font-semibold tracking-[0.25em] text-white/60 uppercase">
                            Navegación
                          </p>
                          <p className="text-lg font-semibold text-white mt-1">
                            ¿A dónde querés ir?
                          </p>
                        </div>

                        <div className="px-3 pb-3">
                          {[
                            { href: '/', label: 'Inicio' },
                            { href: '/productos', label: 'Productos' },
                            { href: '/empresa', label: 'Empresa' },
                            { href: '/contacto', label: 'Contacto' },
                          ].map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsMenuOpen(false)}
                              className="group flex items-center justify-between px-4 py-3 text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                              role="menuitem"
                            >
                              <span className="text-base font-semibold">{item.label}</span>
                              <span className="h-[2px] w-0 bg-white/80 group-hover:w-10 transition-all duration-300" />
                            </Link>
                          ))}
                        </div>

                        {session && (
                          <div className="border-t border-white/10 p-3">
                            <Link
                              href="/perfil"
                              onClick={() => setIsMenuOpen(false)}
                              className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 transition-colors font-semibold"
                              role="menuitem"
                            >
                              Mi Perfil
                            </Link>
                            <button
                              onClick={() => {
                                signOut()
                                setIsMenuOpen(false)
                              }}
                              className="w-full text-left px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 transition-colors font-semibold"
                              role="menuitem"
                            >
                              Salir
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Iniciar sesión (dejar como está) / Perfil */}
            {session ? (
              <div className="hidden sm:flex items-center space-x-4">
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
                className="h-10 inline-flex items-center bg-white text-black px-6 hover:bg-gray-100 transition-colors font-semibold"
              >
                Iniciar Sesión
              </Link>
            )}

            {/* Carrito (enmarcado como botón) */}
            <Link
              href="/carrito"
              className={[
                'relative inline-flex h-10 items-center justify-center px-4 border transition-all',
                scrolled
                  ? 'border-white/15 bg-white/5 text-white hover:bg-white/10'
                  : 'border-white/20 bg-white/10 text-white hover:bg-white/15 drop-shadow-lg',
              ].join(' ')}
              aria-label="Carrito"
              title="Carrito"
            >
              <ShoppingCart className="w-5 h-5" />
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
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
