'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">
              Crear Cuenta
            </h2>
            <p className="text-gray-600">
              O{' '}
              <Link href="/auth/login" className="font-medium text-black hover:text-gray-600 transition-colors underline">
                inicia sesión si ya tienes cuenta
              </Link>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900">¿Cómo querés comprar?</p>
              <p className="text-xs text-gray-600 mt-1">
                Podés elegir minorista o solicitar cuenta mayorista (requiere aprobación).
              </p>

              <div className="mt-3 space-y-2">
                <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-black transition">
                  <input
                    type="radio"
                    name="customerType"
                    value="RETAIL"
                    checked={formData.customerType === 'RETAIL'}
                    onChange={() => setFormData((p) => ({ ...p, customerType: 'RETAIL' }))}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Minorista</p>
                    <p className="text-xs text-gray-600">
                      Comprás con precio minorista. Podés recibir descuento automático según tu carrito.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-black transition">
                  <input
                    type="radio"
                    name="customerType"
                    value="WHOLESALE"
                    checked={formData.customerType === 'WHOLESALE'}
                    onChange={() => setFormData((p) => ({ ...p, customerType: 'WHOLESALE' }))}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Mayorista</p>
                    <p className="text-xs text-gray-600">
                      Tu cuenta queda pendiente y se aprueba desde administración.
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 transition-colors bg-white"
                    placeholder="Ej: 20-12345678-9"
                  />
                </div>
              ) : null}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 transition-colors bg-white"
                  placeholder="Juan Pérez"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 transition-colors bg-white"
                  placeholder="email@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 transition-colors bg-white"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
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
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 transition-colors bg-white"
                  placeholder="Repite la contraseña"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full bg-black text-white py-3 px-4 border-2 border-black font-semibold hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
