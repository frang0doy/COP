'use client'

import { useEffect, useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()!.split(';').shift() ?? null
  return null
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showRememberPrompt, setShowRememberPrompt] = useState(false)
  const [pendingRedirect, setPendingRedirect] = useState<string>('/')
  const [dontAskRememberAgain, setDontAskRememberAgain] = useState(false)
  const [showCustomerTypePrompt, setShowCustomerTypePrompt] = useState(false)
  const [customerType, setCustomerType] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL')
  const [cuit, setCuit] = useState('')

  const persistSelectedCountryIfAny = async () => {
    // Si el usuario eligió país antes del login, lo persistimos en DB
    let country: string | null = null
    const fromCookie = getCookie('cop.country')
    if (fromCookie) country = decodeURIComponent(fromCookie)
    if (!country) {
      try {
        country = localStorage.getItem('cop.country')
      } catch {}
    }
    if (country !== 'AR') return

    try {
      await fetch('/api/me/country', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: 'AR' }),
      })
    } catch {}
  }

  const goTo = (url: string) => {
    router.push(url)
    router.refresh()
  }

  const proceedAfterLogin = async (redirectTo: string) => {
    await persistSelectedCountryIfAny()

    // Si el user no tiene definido el tipo de cliente, lo preguntamos (solo primera vez).
    try {
      const res = await fetch('/api/me', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      const ct = data?.user?.customerType as string | undefined
      const role = data?.user?.role as string | undefined
      // Admin no debe ver este prompt.
      if (!ct && role !== 'ADMIN') {
        setPendingRedirect(redirectTo)
        setShowCustomerTypePrompt(true)
        return
      }
    } catch {
      // si falla, seguimos el flujo normal
    }

    // Flujo existente de "Recordarme"
    if (rememberMe) {
      try {
        localStorage.setItem('auth.remember.email', email.trim())
        localStorage.setItem('auth.remember.dontAsk', '1')
        setDontAskRememberAgain(true)
      } catch {}
      toast.success('Sesión iniciada correctamente')
      goTo(redirectTo)
      return
    }

    if (dontAskRememberAgain) {
      toast.success('Sesión iniciada correctamente')
      goTo(redirectTo)
      return
    }

    setPendingRedirect(redirectTo)
    setShowRememberPrompt(true)
  }

  useEffect(() => {
    // Pre-cargar email recordado (si existe)
    try {
      const savedEmail = localStorage.getItem('auth.remember.email')
      const dontAsk = localStorage.getItem('auth.remember.dontAsk') === '1'
      setDontAskRememberAgain(dontAsk)
      if (savedEmail) {
        setEmail(savedEmail)
        setRememberMe(true)
        // si ya hay email guardado, nunca volvemos a preguntar
        setDontAskRememberAgain(true)
      }
    } catch {}
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Credenciales incorrectas')
      } else {
        await proceedAfterLogin(callbackUrl)
      }
    } catch (error) {
      toast.error('Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute top-20 left-12 h-[460px] w-[460px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-[-220px] right-[-220px] h-[620px] w-[620px] rounded-full bg-orange-500/15 blur-3xl" />
        <div className="absolute top-16 right-1/3 h-[520px] w-[520px] rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-20 left-1/4 h-[420px] w-[420px] rounded-full bg-orange-400/10 blur-3xl" />
        <div className="absolute -bottom-24 left-[-120px] h-[520px] w-[520px] rounded-full bg-orange-500/8 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-neutral-950" />
      </div>
      {showCustomerTypePrompt && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
          <div className="absolute right-4 top-24 w-[min(92vw,520px)]">
            <div className="bg-neutral-950 border border-white/10 shadow-2xl p-6 ring-1 ring-orange-500/20">
              <div className="h-1 w-12 bg-orange-500/70 rounded-full mb-4" />
              <h3 className="text-lg font-bold text-white">¿Cómo querés comprar?</h3>
              <p className="text-sm text-gray-300 mt-2">
                Elegí minorista o mayorista. Los mayoristas ven precios mayoristas donde estén cargados.
              </p>

              <div className="mt-4 space-y-2">
                <label className="flex items-start gap-3 p-3 bg-neutral-900/60 border border-white/10 rounded-xl cursor-pointer hover:border-orange-500/40 transition">
                  <input
                    type="radio"
                    name="ct"
                    value="RETAIL"
                    checked={customerType === 'RETAIL'}
                    onChange={() => setCustomerType('RETAIL')}
                    className="mt-1 accent-orange-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">Minorista</p>
                    <p className="text-xs text-gray-300">
                      Comprás normalmente con posible descuento por carrito.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-neutral-900/60 border border-white/10 rounded-xl cursor-pointer hover:border-orange-500/40 transition">
                  <input
                    type="radio"
                    name="ct"
                    value="WHOLESALE"
                    checked={customerType === 'WHOLESALE'}
                    onChange={() => setCustomerType('WHOLESALE')}
                    className="mt-1 accent-orange-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">Mayorista</p>
                    <p className="text-xs text-gray-300">
                      Usás la lista mayorista (CUIT obligatorio).
                    </p>
                  </div>
                </label>
              </div>

              {customerType === 'WHOLESALE' ? (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    CUIT (obligatorio)
                  </label>
                  <input
                    type="text"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    className="w-full px-3 py-2 border border-white/10 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 bg-neutral-900/60 text-white placeholder:text-gray-500 transition"
                    placeholder="Ej: 20-12345678-9"
                  />
                </div>
              ) : null}

              <div className="mt-5 flex gap-3 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-white/10 text-white hover:border-orange-500/40 hover:text-orange-200 transition focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  onClick={() => {
                    // no dejamos seguir sin elegir: cerrarlo sería volver a pedir.
                    setShowCustomerTypePrompt(false)
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white border border-orange-600 hover:bg-orange-700 hover:border-orange-700 transition focus:outline-none focus:ring-2 focus:ring-orange-200"
                  onClick={async () => {
                    if (customerType === 'WHOLESALE' && !cuit.trim()) {
                      toast.error('El CUIT es obligatorio para mayoristas')
                      return
                    }
                    const res = await fetch('/api/me/customer-type', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        customerType,
                        cuit: customerType === 'WHOLESALE' ? cuit.trim() : undefined,
                      }),
                    })
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok) {
                      toast.error(data?.error || 'No se pudo guardar')
                      return
                    }
                    setShowCustomerTypePrompt(false)
                    toast.success('Listo')
                    // Continuamos con el flujo de recordarme/redirección.
                    await proceedAfterLogin(pendingRedirect)
                  }}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRememberPrompt && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setShowRememberPrompt(false)}
          />
          <div className="absolute right-4 top-24 w-[min(92vw,420px)]">
            <div className="bg-neutral-950 border border-white/10 shadow-2xl p-6 ring-1 ring-orange-500/20">
              <div className="h-1 w-12 bg-orange-500/70 rounded-full mb-4" />
              <h3 className="text-lg font-bold text-white">¿Guardar datos de la cuenta?</h3>
              <p className="text-sm text-gray-300 mt-2">
                Podemos recordar tu email en este dispositivo para que sea más rápido iniciar sesión.
              </p>
              <div className="mt-5 flex gap-3 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-white/10 text-white hover:border-orange-500/40 hover:text-orange-200 transition focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  onClick={async () => {
                    // Si elige "No", NO guardamos preferencia: se le volverá a preguntar en próximos logins.
                    try {
                      localStorage.removeItem('auth.remember.email')
                      localStorage.removeItem('auth.remember.dontAsk')
                    } catch {}
                    setDontAskRememberAgain(false)
                    setShowRememberPrompt(false)
                    toast.success('Sesión iniciada correctamente')
                    await persistSelectedCountryIfAny()
                    goTo(pendingRedirect)
                  }}
                >
                  No guardar
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white border border-orange-600 hover:bg-orange-700 hover:border-orange-700 transition focus:outline-none focus:ring-2 focus:ring-orange-200"
                  onClick={async () => {
                    try {
                      localStorage.setItem('auth.remember.email', email.trim())
                      localStorage.setItem('auth.remember.dontAsk', '1')
                    } catch {}
                    setDontAskRememberAgain(true)
                    setShowRememberPrompt(false)
                    toast.success('Sesión iniciada correctamente')
                    await persistSelectedCountryIfAny()
                    goTo(pendingRedirect)
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-5xl mx-auto"
      >
        <div className="flex justify-center">
          <Image
            src="/images/logocop.png"
            alt="COP"
            width={340}
            height={110}
            priority
            className="h-20 sm:h-24 w-auto drop-shadow-[0_22px_55px_rgba(249,115,22,0.14)]"
          />
        </div>

        <div className="relative grid md:grid-cols-2 overflow-hidden rounded-3xl shadow-2xl border border-white/10 mt-6">
          <div className="relative p-10 sm:p-12 bg-gradient-to-br from-neutral-950 via-purple-950 to-neutral-900 text-white flex items-center justify-center">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -left-28 -bottom-28 h-96 w-96 rounded-full bg-orange-500/16 blur-3xl" />
              <div className="absolute right-[-140px] top-8 h-96 w-96 rounded-full bg-fuchsia-500/12 blur-3xl" />
              <div className="absolute left-[10%] top-[22%] h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="absolute -left-10 top-1/2 h-40 w-[520px] -translate-y-1/2 rotate-[-18deg] bg-gradient-to-r from-orange-400/45 via-orange-400/14 to-transparent blur-[1px]" />
              <div className="absolute left-10 top-[72%] h-32 w-[420px] rotate-[-18deg] bg-gradient-to-r from-orange-300/34 via-orange-300/10 to-transparent blur-[1px]" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/35 to-black/50" />
            </div>

            <motion.div
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
              className="relative text-center max-w-md"
            >
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Bienvenido a <span className="text-orange-200">COP</span>
              </h1>
              <p className="mt-4 text-sm sm:text-base text-white/85">
                Iniciá sesión para acceder a tu cuenta, gestionar tus pedidos y continuar tu compra de forma rápida y segura.
              </p>
            </motion.div>
          </div>

          <div className="relative bg-white p-10 sm:p-12 flex flex-col justify-center">
            <div className="mx-auto w-full max-w-sm">
              <div className="text-center">
                <p className="text-xs tracking-[0.2em] font-semibold text-gray-500">
                  INICIO DE SESIÓN
                </p>
                <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Accedé a tu cuenta
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  ¿No tenés cuenta?{' '}
                  <Link href="/auth/register" className="font-semibold text-orange-700 hover:text-orange-800 transition-colors underline decoration-orange-300 underline-offset-4">
                    Registrate
                  </Link>
                </p>
              </div>

              <form className="space-y-6 mt-8" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="group relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-600 transition-colors" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-shadow bg-white text-gray-900 placeholder:text-gray-400 shadow-sm"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="group relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-600 transition-colors" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-shadow bg-white text-gray-900 placeholder:text-gray-400 shadow-sm"
                      placeholder="Tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-700 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                      Recordarme
                    </label>
                  </div>

                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm font-semibold text-gray-700 hover:text-orange-800 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full rounded-xl py-3 px-4 font-semibold text-white shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </motion.button>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="absolute top-20 left-12 h-[460px] w-[460px] rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute bottom-[-220px] right-[-220px] h-[620px] w-[620px] rounded-full bg-orange-500/15 blur-3xl" />
          <div className="absolute top-16 right-1/3 h-[520px] w-[520px] rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute bottom-20 left-1/4 h-[420px] w-[420px] rounded-full bg-orange-400/10 blur-3xl" />
          <div className="absolute -bottom-24 left-[-120px] h-[520px] w-[520px] rounded-full bg-orange-500/8 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-neutral-950" />
        </div>
        <div className="relative w-full max-w-5xl">
          <div className="flex justify-center">
            <div className="h-14 w-56 bg-white/10 rounded-2xl" />
          </div>
          <div className="grid md:grid-cols-2 overflow-hidden rounded-3xl shadow-2xl border border-white/10 mt-6">
            <div className="relative p-10 sm:p-12 bg-gradient-to-br from-neutral-950 via-purple-950 to-neutral-900">
              <div className="animate-pulse">
                <div className="h-10 bg-white/15 rounded w-2/3 mb-4" />
                <div className="h-4 bg-white/15 rounded w-5/6 mb-2" />
                <div className="h-4 bg-white/15 rounded w-4/6" />
              </div>
            </div>
            <div className="relative bg-white p-10 sm:p-12">
              <div className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded w-1/2 mx-auto mb-6" />
                <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto mb-8" />
                <div className="space-y-4">
                  <div className="h-12 bg-gray-200 rounded-xl" />
                  <div className="h-12 bg-gray-200 rounded-xl" />
                  <div className="h-12 bg-gray-200 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
