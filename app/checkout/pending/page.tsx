'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock, ShoppingCart, Home } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

type OrderItem = { id: string; name: string; quantity: number; unitPrice: number; subtotal: number }
type Order = {
  id: string
  number?: number | null
  total: number
  paymentMethod: 'MERCADOPAGO' | 'PAY_AT_FACTORY'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  discountPercent: number
  discountAmount: number
  shipping?: any
  items: OrderItem[]
}

function normalizeWhatsappNumber(raw: string) {
  return String(raw || '').replace(/\D+/g, '').trim()
}

function buildWhatsappText(order: Order) {
  const ship = order.shipping ?? {}
  const delivery =
    ship.deliveryMethod === 'PICKUP_FACTORY'
      ? 'Retiro en fábrica'
      : ship.deliveryMethod === 'AGREE_WITH_COMPANY'
        ? 'Envío a coordinar'
        : '—'

  const lines: string[] = []
  lines.push('Hola COP, quiero coordinar el pago/entrega de mi pedido.')
  lines.push('')
  lines.push(`Pedido: #${order.number ?? order.id}`)
  if (ship.name) lines.push(`Nombre: ${ship.name}`)
  if (ship.email) lines.push(`Email: ${ship.email}`)
  if (ship.phone) lines.push(`Teléfono: ${ship.phone}`)
  if (ship.cuit) lines.push(`CUIT: ${ship.cuit}`)
  lines.push(`Entrega: ${delivery}`)
  lines.push(`Total: $${Number(order.total || 0).toLocaleString('es-MX')}`)
  if (order.discountPercent > 0) {
    lines.push(`Descuento: ${order.discountPercent}%`)
  }
  lines.push('')
  lines.push('Ítems:')
  for (const it of order.items || []) {
    lines.push(`- ${it.quantity} x ${it.name} ($${Number(it.unitPrice || 0).toLocaleString('es-MX')})`)
  }
  lines.push('')
  lines.push('Gracias.')
  return lines.join('\n')
}

export default function CheckoutPendingPage() {
  const searchParams = useSearchParams()
  const orderId = (searchParams.get('order_id') || '').trim()
  const companyWhatsapp = normalizeWhatsappNumber(process.env.NEXT_PUBLIC_COMPANY_WHATSAPP || '')

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!orderId) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (cancelled) return
      if (res.ok) setOrder((data?.order ?? null) as Order | null)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [orderId])

  const whatsappText = useMemo(() => (order ? buildWhatsappText(order) : ''), [order])
  const whatsappUrl = useMemo(() => {
    if (!companyWhatsapp || !whatsappText) return ''
    return `https://wa.me/${companyWhatsapp}?text=${encodeURIComponent(whatsappText)}`
  }, [companyWhatsapp, whatsappText])

  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 rounded-full p-4">
              <Clock className="w-16 h-16 text-yellow-700" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Pedido pendiente</h1>
          <p className="text-lg text-gray-600 mb-6">
            Tu pedido quedó pendiente. Si elegiste “Pagar en fábrica / otros medios”, vamos a coordinar por WhatsApp.
          </p>

          {orderId ? (
            <p className="text-sm text-gray-600 mb-6">
              Pedido: <span className="font-semibold text-gray-900">{order?.number ? `#${order.number}` : orderId}</span>
              {loading ? <span className="ml-2 text-gray-500">Cargando…</span> : null}
            </p>
          ) : null}

          {whatsappUrl ? (
            <div className="mb-6 border border-orange-200 bg-orange-50 p-4 text-left">
              <p className="text-sm font-semibold text-orange-900">
                Paso obligatorio: coordinar por WhatsApp
              </p>
              <p className="text-xs text-orange-900/80 mt-1">
                Tu pedido ya quedó pendiente en la web. Para finalizar la coordinación del pago/entrega, es necesario
                enviar este mensaje por WhatsApp.
              </p>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-orange-600 text-white px-5 py-3 border border-orange-600 hover:bg-orange-700 hover:border-orange-700 transition font-semibold"
                >
                  Abrir WhatsApp
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (!whatsappText) return
                      await navigator.clipboard.writeText(whatsappText)
                      toast.success('Mensaje copiado')
                    } catch {
                      toast.error('No se pudo copiar')
                    }
                  }}
                  className="inline-flex items-center justify-center bg-white text-gray-900 px-5 py-3 border border-gray-200 hover:border-orange-300 hover:text-orange-800 transition font-semibold"
                >
                  Copiar mensaje
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 border border-gray-200 bg-gray-50 p-4 text-left">
              <p className="text-sm font-semibold text-gray-900">WhatsApp no configurado</p>
              <p className="text-xs text-gray-600 mt-1">
                Configurá <code className="font-semibold">NEXT_PUBLIC_COMPANY_WHATSAPP</code> en Vercel (solo dígitos, ej: 5493515900630).
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/carrito"
              className="inline-flex items-center justify-center space-x-2 bg-black text-white px-6 py-3 border-2 border-black hover:bg-gray-900 transition"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Volver al carrito</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center space-x-2 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              <Home className="w-5 h-5" />
              <span>Volver al inicio</span>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

