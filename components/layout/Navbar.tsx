'use client'

import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { motion, AnimatePresence } from 'framer-motion'

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()!.split(';').shift() ?? null
  return null
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuPanelStyle, setMenuPanelStyle] = useState<React.CSSProperties>({})
  const [userMenuPanelStyle, setUserMenuPanelStyle] = useState<React.CSSProperties>({})
  const [countryLabel, setCountryLabel] = useState<string>('Argentina')
  const pathname = usePathname()
  const { data: session } = useSession()
  const { itemsCount } = useCart()
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const menuPanelRef = useRef<HTMLDivElement | null>(null)
  const userButtonRef = useRef<HTMLButtonElement | null>(null)
  const userPanelRef = useRef<HTMLDivElement | null>(null)
  
  // Detectar si estamos en la página de inicio
  const isHomePage = pathname === '/'

  const openCountryPicker = () => {
    try {
      window.dispatchEvent(new CustomEvent('cop:open-country-picker'))
    } catch {}
    setIsMenuOpen(false)
    setIsUserMenuOpen(false)
  }

  useEffect(() => {
    // Leer país actual (cookie) y escuchar cambios
    const read = () => {
      const raw = getCookie('cop.country')
      const code = raw ? decodeURIComponent(raw) : null
      setCountryLabel(code === 'AR' ? 'Argentina' : code === 'MX' ? 'México' : code === 'CU' ? 'Cuba' : 'Argentina')
    }
    read()
    const onChange = () => read()
    window.addEventListener('cop:country-changed' as any, onChange as any)
    return () => window.removeEventListener('cop:country-changed' as any, onChange as any)
  }, [])

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
    setIsUserMenuOpen(false)
  }, [pathname])

  // Detectar si el usuario es admin (para mostrar accesos)
  useEffect(() => {
    if (!session) {
      setIsAdmin(false)
      return
    }
    // Si el rol viene en la session, mostramos admin inmediatamente (evita depender de /api/me).
    if ((session.user as any)?.role === 'ADMIN') {
      setIsAdmin(true)
      return
    }
    let cancelled = false
    ;(async () => {
      const res = await fetch('/api/me', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (cancelled) return
      setIsAdmin(data?.user?.role === 'ADMIN')
    })()
    return () => {
      cancelled = true
    }
  }, [session])

  // Cerrar menú con click afuera / Escape
  useEffect(() => {
    if (!isMenuOpen && !isUserMenuOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
        setIsUserMenuOpen(false)
      }
    }
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      const clickedMenuButton = menuButtonRef.current?.contains(target) ?? false
      const clickedMenuPanel = menuPanelRef.current?.contains(target) ?? false
      const clickedUserButton = userButtonRef.current?.contains(target) ?? false
      const clickedUserPanel = userPanelRef.current?.contains(target) ?? false

      if (!clickedMenuButton && !clickedMenuPanel) setIsMenuOpen(false)
      if (!clickedUserButton && !clickedUserPanel) setIsUserMenuOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [isMenuOpen])

  // Posicionar el panel exactamente debajo del botón "Menú" (aunque esté en portal)
  useEffect(() => {
    if (!isMenuOpen) return

    const updatePosition = () => {
      const btn = menuButtonRef.current
      if (!btn) return

      const rect = btn.getBoundingClientRect()
      const gap = 12
      const margin = 16
      const panelWidth = Math.min(420, Math.max(280, window.innerWidth - margin * 2))

      // Alinear con el borde derecho del botón, y clamplear dentro del viewport
      const desiredLeft = rect.right - panelWidth
      const left = Math.max(margin, Math.min(desiredLeft, window.innerWidth - panelWidth - margin))
      const top = rect.bottom + gap

      setMenuPanelStyle({
        top,
        left,
        width: panelWidth,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [isMenuOpen])

  // Posicionar el panel exactamente debajo del botón de usuario
  useEffect(() => {
    if (!isUserMenuOpen) return

    const updatePosition = () => {
      const btn = userButtonRef.current
      if (!btn) return

      const rect = btn.getBoundingClientRect()
      const gap = 12
      const margin = 16
      const panelWidth = Math.min(360, Math.max(260, window.innerWidth - margin * 2))

      const desiredLeft = rect.right - panelWidth
      const left = Math.max(margin, Math.min(desiredLeft, window.innerWidth - panelWidth - margin))
      const top = rect.bottom + gap

      setUserMenuPanelStyle({
        top,
        left,
        width: panelWidth,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [isUserMenuOpen])

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
      {/* Backdrop + panel en portal para que el blur afecte a TODA la pantalla (no queda limitado por el transform del nav) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {(isMenuOpen || isUserMenuOpen) && (
              <>
                {/* Backdrop compartido */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-md"
                  onClick={() => {
                    setIsMenuOpen(false)
                    setIsUserMenuOpen(false)
                  }}
                />

                {/* Panel de navegación */}
                <AnimatePresence>
                <motion.div
                  ref={menuPanelRef}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed z-[100]"
                  style={menuPanelStyle}
                  role="menu"
                >
                  {isMenuOpen ? (
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
                        { href: '/tutoriales-cop', label: 'Tutoriales COP' },
                        { href: '/contacto', label: 'Contacto' },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="group flex items-center justify-between px-4 py-3 text-white/85 hover:text-orange-500 hover:bg-orange-500/10 transition-colors"
                          role="menuitem"
                        >
                          <span className="text-base font-semibold">{item.label}</span>
                          <span className="h-[2px] w-0 bg-orange-500 group-hover:w-10 transition-all duration-300" />
                        </Link>
                      ))}
                    </div>
                  </div>
                  ) : null}
                </motion.div>
                </AnimatePresence>

                {/* Panel de usuario */}
                <AnimatePresence>
                  {isUserMenuOpen && session ? (
                    <motion.div
                      ref={userPanelRef}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="fixed z-[110]"
                      style={userMenuPanelStyle}
                      role="menu"
                    >
                      <div className="bg-black/95 border border-white/10 shadow-2xl overflow-hidden">
                        <div className="p-5">
                          <p className="text-xs font-semibold tracking-[0.25em] text-white/60 uppercase">
                            Cuenta
                          </p>
                          <p className="text-lg font-semibold text-white mt-1">
                            {session.user?.name || session.user?.email || 'Mi cuenta'}
                          </p>
                        </div>

                        <div className="px-3 pb-3">
                          <Link
                            href="/perfil"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="group flex items-center justify-between px-4 py-3 text-white/85 hover:text-orange-500 hover:bg-orange-500/10 transition-colors"
                            role="menuitem"
                          >
                            <span className="text-base font-semibold">Mi perfil</span>
                            <span className="h-[2px] w-0 bg-orange-500 group-hover:w-10 transition-all duration-300" />
                          </Link>
                          <Link
                            href="/pedidos"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="group flex items-center justify-between px-4 py-3 text-white/85 hover:text-orange-500 hover:bg-orange-500/10 transition-colors"
                            role="menuitem"
                          >
                            <span className="text-base font-semibold">Mis pedidos</span>
                            <span className="h-[2px] w-0 bg-orange-500 group-hover:w-10 transition-all duration-300" />
                          </Link>
                          {isAdmin ? (
                            <>
                              <Link
                                href="/admin/productos"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="group flex items-center justify-between px-4 py-3 text-white/85 hover:text-orange-500 hover:bg-orange-500/10 transition-colors"
                                role="menuitem"
                              >
                                <span className="text-base font-semibold">Admin productos</span>
                                <span className="h-[2px] w-0 bg-orange-500 group-hover:w-10 transition-all duration-300" />
                              </Link>
                              <Link
                                href="/admin/pedidos"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="group flex items-center justify-between px-4 py-3 text-white/85 hover:text-orange-500 hover:bg-orange-500/10 transition-colors"
                                role="menuitem"
                              >
                                <span className="text-base font-semibold">Admin pedidos</span>
                                <span className="h-[2px] w-0 bg-orange-500 group-hover:w-10 transition-all duration-300" />
                              </Link>
                              <Link
                                href="/admin/usuarios"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="group flex items-center justify-between px-4 py-3 text-white/85 hover:text-orange-500 hover:bg-orange-500/10 transition-colors"
                                role="menuitem"
                              >
                                <span className="text-base font-semibold">Admin usuarios</span>
                                <span className="h-[2px] w-0 bg-orange-500 group-hover:w-10 transition-all duration-300" />
                              </Link>
                            </>
                          ) : null}
                        </div>

                        <div className="border-t border-white/10 p-3">
                          <button
                            type="button"
                            onClick={openCountryPicker}
                            className="group w-full flex items-center justify-between px-4 py-3 text-white/80 hover:text-orange-500 hover:bg-orange-500/10 transition-colors font-semibold"
                            role="menuitem"
                          >
                            <span>Cambiar país</span>
                            <span className="text-sm font-semibold text-white/60 group-hover:text-orange-500 transition-colors">
                              {countryLabel}
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              signOut({ callbackUrl: '/' })
                              setIsUserMenuOpen(false)
                            }}
                            className="w-full text-left px-4 py-3 text-white/80 hover:text-orange-500 hover:bg-orange-500/10 transition-colors font-semibold"
                            role="menuitem"
                          >
                            Cerrar sesión
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

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
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen((v) => !v)
                  setIsUserMenuOpen(false)
                }}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                ref={menuButtonRef}
                className={[
                  'inline-flex h-10 items-center gap-2 px-4 border font-semibold transition-all',
                  scrolled
                    ? 'border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-orange-500 hover:text-orange-500'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/15 hover:border-orange-500 hover:text-orange-500 drop-shadow-lg',
                ].join(' ')}
              >
                <Menu className="w-4 h-4" />
                Menú
              </button>
            </div>

            {/* Usuario / Iniciar sesión */}
            {session ? (
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen((v) => !v)
                  setIsMenuOpen(false)
                }}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                ref={userButtonRef}
                className={[
                  'inline-flex h-10 items-center justify-center px-4 border transition-all',
                  scrolled
                    ? 'border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-orange-500 hover:text-orange-500'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/15 hover:border-orange-500 hover:text-orange-500 drop-shadow-lg',
                ].join(' ')}
                title="Mi cuenta"
              >
                <User className="w-5 h-5" />
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="h-10 inline-flex items-center bg-white text-black px-6 border border-black/10 hover:bg-gray-100 hover:border-orange-500 hover:text-orange-500 transition-colors font-semibold"
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
                  ? 'border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-orange-500 hover:text-orange-500'
                  : 'border-white/20 bg-white/10 text-white hover:bg-white/15 hover:border-orange-500 hover:text-orange-500 drop-shadow-lg',
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
