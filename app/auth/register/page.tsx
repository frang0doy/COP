'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { signIn } from 'next-auth/react'

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()!.split(';').shift() ?? null
  return null
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    customerType: 'RETAIL' as 'RETAIL' | 'WHOLESALE',
    cuit: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const persistSelectedCountryIfAny = async () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          customerType: formData.customerType,
          cuit: formData.customerType === 'WHOLESALE' ? formData.cuit : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || 'Error al crear la cuenta')
        return
      }

      // Auto-login
      const login = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (login?.error) {
        toast.success('Cuenta creada. Ahora inicia sesión.')
        router.push('/auth/login')
        return
      }

      toast.success('Cuenta creada e inicio de sesión exitoso')
      await persistSelectedCountryIfAny()
      router.push('/perfil')
      router.refresh()
    } catch (error) {
      toast.error('Error al crear la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-indigo-500/22 blur-3xl" />
        <div className="absolute top-20 left-12 h-[460px] w-[460px] rounded-full bg-fuchsia-500/18 blur-3xl" />
        <div className="absolute bottom-[-220px] right-[-220px] h-[620px] w-[620px] rounded-full bg-orange-500/14 blur-3xl" />
        <div className="absolute top-16 right-1/3 h-[520px] w-[520px] rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-20 left-1/4 h-[420px] w-[420px] rounded-full bg-orange-400/10 blur-3xl" />
        <div className="absolute -bottom-24 left-[-120px] h-[520px] w-[520px] rounded-full bg-orange-500/8 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-neutral-950" />
      </div>
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
                Creá tu cuenta para comprar más rápido, ver tus pedidos y acceder a beneficios según tu tipo de cliente.
              </p>
            </motion.div>
          </div>

          <div className="relative bg-white p-10 sm:p-12 flex flex-col justify-center">
            <div className="mx-auto w-full max-w-sm">
              <div className="text-center">
                <p className="text-xs tracking-[0.2em] font-semibold text-gray-500">
                  REGISTRO
                </p>
                <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Crear cuenta
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  ¿Ya tenés cuenta?{' '}
                  <Link href="/auth/login" className="font-semibold text-orange-700 hover:text-orange-800 transition-colors underline decoration-orange-300 underline-offset-4">
                    Iniciá sesión
                  </Link>
                </p>
              </div>

              <form className="space-y-5 mt-8" onSubmit={handleSubmit}>
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900">¿Cómo querés comprar?</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Elegí minorista o mayorista. Los mayoristas ven la lista de precios mayorista (CUIT obligatorio).
                  </p>

                  <div className="mt-3 space-y-2">
                    <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-orange-500 transition">
                      <input
                        type="radio"
                        name="customerType"
                        value="RETAIL"
                        checked={formData.customerType === 'RETAIL'}
                        onChange={() => setFormData((p) => ({ ...p, customerType: 'RETAIL' }))}
                        className="mt-1 accent-orange-500"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Minorista</p>
                        <p className="text-xs text-gray-600">
                          Comprás con precio minorista y descuento automático según tu carrito.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-orange-500 transition">
                      <input
                        type="radio"
                        name="customerType"
                        value="WHOLESALE"
                        checked={formData.customerType === 'WHOLESALE'}
                        onChange={() => setFormData((p) => ({ ...p, customerType: 'WHOLESALE' }))}
                        className="mt-1 accent-orange-500"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Mayorista</p>
                        <p className="text-xs text-gray-600">
                          Accedés al catálogo con precio mayorista donde esté definido.
                        </p>
                      </div>
                    </label>
                  </div>

                  {formData.customerType === 'WHOLESALE' ? (
                    <div className="mt-4">
                      <label htmlFor="cuit" className="block text-sm font-medium text-gray-700 mb-2">
                        CUIT (obligatorio para mayoristas)
                      </label>
                      <input
                        id="cuit"
                        name="cuit"
                        type="text"
                        required
                        value={formData.cuit}
                        onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-shadow bg-white text-gray-900 placeholder:text-gray-400 shadow-sm"
                        placeholder="Ej: 20-12345678-9"
                      />
                    </div>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo
                  </label>
                  <div className="group relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-600 transition-colors" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-shadow bg-white text-gray-900 placeholder:text-gray-400 shadow-sm"
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>

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
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-shadow bg-white text-gray-900 placeholder:text-gray-400 shadow-sm"
                      placeholder="email@ejemplo.com"
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
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-shadow bg-white text-gray-900 placeholder:text-gray-400 shadow-sm"
                      placeholder="Mínimo 6 caracteres"
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

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña
                  </label>
                  <div className="group relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-600 transition-colors" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-shadow bg-white text-gray-900 placeholder:text-gray-400 shadow-sm"
                      placeholder="Repite la contraseña"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full rounded-xl py-3 px-4 font-semibold text-white shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </motion.button>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
