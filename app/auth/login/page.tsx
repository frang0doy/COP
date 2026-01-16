'use client'

import { useEffect, useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

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

  useEffect(() => {
    // Pre-cargar email recordado (si existe)
    try {
      const savedEmail = localStorage.getItem('auth.remember.email')
      if (savedEmail) {
        setEmail(savedEmail)
        setRememberMe(true)
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
        // Guardar email si marcó "Recordarme", si no preguntamos antes de redirigir
        if (rememberMe) {
          try {
            localStorage.setItem('auth.remember.email', email.trim())
          } catch {}
          toast.success('Sesión iniciada correctamente')
          router.push(callbackUrl)
          router.refresh()
          return
        }

        setPendingRedirect(callbackUrl)
        setShowRememberPrompt(true)
      }
    } catch (error) {
      toast.error('Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      {showRememberPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowRememberPrompt(false)}
          />
          <div className="relative w-full max-w-md bg-white border border-gray-200 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900">¿Guardar datos de la cuenta?</h3>
            <p className="text-sm text-gray-600 mt-2">
              Podemos recordar tu email en este dispositivo para que sea más rápido iniciar sesión.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                className="px-4 py-2 border border-gray-200 text-gray-800 hover:border-black transition"
                onClick={() => {
                  try {
                    localStorage.removeItem('auth.remember.email')
                  } catch {}
                  setShowRememberPrompt(false)
                  toast.success('Sesión iniciada correctamente')
                  router.push(pendingRedirect)
                  router.refresh()
                }}
              >
                No guardar
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-black text-white border-2 border-black hover:bg-gray-900 transition"
                onClick={() => {
                  try {
                    localStorage.setItem('auth.remember.email', email.trim())
                  } catch {}
                  setShowRememberPrompt(false)
                  toast.success('Sesión iniciada correctamente')
                  router.push(pendingRedirect)
                  router.refresh()
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">
              Iniciar Sesión
            </h2>
            <p className="text-gray-600">
              O{' '}
              <Link href="/auth/register" className="font-medium text-black hover:text-gray-600 transition-colors underline">
                crea una cuenta nueva
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 transition-colors bg-white"
                  placeholder="tu@email.com"
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 transition-colors bg-white"
                  placeholder="Tu contraseña"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Recordarme
                </label>
              </div>

              <Link 
                href="/auth/forgot-password" 
                className="text-sm font-medium text-black hover:text-gray-600 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full bg-black text-white py-3 px-4 border-2 border-black font-semibold hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </motion.button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              <strong className="text-black">Demo:</strong> Usa cualquier email y contraseña para probar el sistema.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-8"></div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
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
