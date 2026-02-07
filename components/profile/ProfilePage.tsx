'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { User, Mail, Package, Settings, Phone, MapPin, Save, Shield } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import OrdersList from '@/components/orders/OrdersList'

type Me = {
  id: string
  email: string
  name?: string | null
  country?: 'AR' | 'MX' | 'CU' | null
  phone?: string | null
  cuit?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  role?: 'USER' | 'ADMIN'
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    cuit: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  })

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

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const res = await fetch('/api/me', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (!cancelled) toast.error(data?.error || 'Error al cargar perfil')
        if (!cancelled) setLoading(false)
        return
      }
      if (cancelled) return
      const user = data?.user as Me
      setMe(user)
      setForm({
        name: user?.name ?? '',
        phone: user?.phone ?? '',
        cuit: user?.cuit ?? '',
        address: user?.address ?? '',
        city: user?.city ?? '',
        state: user?.state ?? '',
        zipCode: user?.zipCode ?? '',
      })
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const onSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/me/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'No se pudo guardar')
        return
      }
      setMe(data.user as Me)
      toast.success('Perfil actualizado')
    } finally {
      setSaving(false)
    }
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
                  <input
                    disabled={loading}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-black focus:ring-0 bg-white"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{me?.email || session.user?.email || '—'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    disabled={loading}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-black focus:ring-0 bg-white"
                    placeholder="Ej: +52 ..."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700">CUIT</label>
                  <input
                    disabled={loading}
                    value={form.cuit}
                    onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-black focus:ring-0 bg-white"
                    placeholder="Ej: 20-12345678-9"
                  />
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-2" />
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <textarea
                    disabled={loading}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows={2}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-black focus:ring-0 bg-white"
                    placeholder="Calle, número, etc."
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <input
                      disabled={loading}
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-black focus:ring-0 bg-white"
                      placeholder="Ciudad"
                    />
                    <input
                      disabled={loading}
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-black focus:ring-0 bg-white"
                      placeholder="Estado"
                    />
                    <input
                      disabled={loading}
                      value={form.zipCode}
                      onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-black focus:ring-0 bg-white"
                      placeholder="CP"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <button
                onClick={onSave}
                disabled={loading || saving}
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-2 border-2 border-black hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>

          {me?.role === 'ADMIN' ? (
            <div className="bg-white rounded-lg shadow-md p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Pedidos (todos)</h2>
              <p className="text-sm text-gray-600 mb-6">
                Lista de pedidos de todos los clientes (solo admin).
              </p>
              <OrdersList mode="all" />
            </div>
          ) : null}
        </div>

        {/* Menú rápido */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Accesos Rápidos</h2>

            <div className="space-y-2">
              {me?.role === 'ADMIN' ? (
                <Link
                  href="/admin/productos"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">Admin productos</span>
                </Link>
              ) : null}
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

