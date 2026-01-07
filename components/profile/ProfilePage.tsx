'use client'

import { useSession } from 'next-auth/react'
import { User, Mail, Package, Settings } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: session } = useSession()

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tu perfil</p>
          <Link
            href="/auth/login"
            className="text-black hover:text-gray-600 transition-colors font-semibold"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Perfil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Información del usuario */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Personal</h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <p className="text-gray-900">{session.user?.name || 'No especificado'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{session.user?.email || 'No especificado'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <button className="bg-black text-white px-6 py-2 border-2 border-black hover:bg-gray-900 transition">
                Editar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Menú rápido */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Accesos Rápidos</h2>

            <div className="space-y-2">
              <Link
                href="/pedidos"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition"
              >
                <Package className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Mis Pedidos</span>
              </Link>

              <Link
                href="/carrito"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition"
              >
                <Package className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Carrito de Compras</span>
              </Link>

              <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition text-left">
                <Settings className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Configuración</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

