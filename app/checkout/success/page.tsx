'use client'

import { Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, Home, MessageCircle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/context/CartContext'
import { useEffect, useMemo, useState } from 'react'

type DeliveryMethod = 'PICKUP_FACTORY' | 'AGREE_WITH_COMPANY'

function normalizePhoneForWa(phone: string) {
  // wa.me requiere número con código de país, solo dígitos
  return (phone || '').replace(/[^\d]/g, '')
}

function buildWhatsAppUrl(params: { phone: string; text: string }) {
  const digits = normalizePhoneForWa(params.phone)
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(params.text)}`
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  // Mercado Pago puede volver con distintos nombres de parámetro según flujo/version.
  // Soportamos variantes comunes para asegurar confirmación + baja de stock + email.
  const paymentId =
    searchParams.get('payment_id') ||
    searchParams.get('collection_id') ||
    searchParams.get('paymentId') ||
    searchParams.get('collectionId')
  const orderId = searchParams.get('order_id')
  const deliveryMethodParam = (searchParams.get('delivery_method') || '').trim() as DeliveryMethod | ''
  const { clearCart } = useCart()
  const factoryAddressLine1 = 'Sta. Bárbara'
  const factoryAddressLine2 = 'X5006 Córdoba, Argentina'
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [orderStatus, setOrderStatus] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)
  const [buyerName, setBuyerName] = useState<string>('')
  const [buyerEmail, setBuyerEmail] = useState<string>('')
  const [buyerCuit, setBuyerCuit] = useState<string>('')
  const [orderItems, setOrderItems] = useState<Array<{ name: string; quantity: number }> | null>(
    null
  )
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(
    deliveryMethodParam === 'PICKUP_FACTORY' || deliveryMethodParam === 'AGREE_WITH_COMPANY'
      ? deliveryMethodParam
      : null
  )
  const didSyncRef = useRef(false)

  const canSync = useMemo(() => Boolean(paymentId && orderId), [paymentId, orderId])

  useEffect(() => {
    if (!canSync) return
    if (didSyncRef.current) return
    didSyncRef.current = true

    let cancelled = false
    setSyncing(true)
    setSyncError(null)

    ;(async () => {
      try {
        const res = await fetch('/api/mercadopago/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, orderId }),
          cache: 'no-store',
        })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || 'No se pudo confirmar el pedido')
        }

        setOrderStatus(data?.order?.status ?? null)
        // Traer info del pedido (número/estado) para mostrar confirmación real.
        if (orderId) {
          const orderRes = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' })
          const orderJson = await orderRes.json().catch(() => ({}))
          if (orderRes.ok) {
            setOrderNumber(orderJson?.order?.number ?? null)
            setOrderStatus((prev) => prev ?? orderJson?.order?.status ?? null)
            const dm = orderJson?.order?.shipping?.deliveryMethod
            if (dm === 'PICKUP_FACTORY' || dm === 'AGREE_WITH_COMPANY') {
              setDeliveryMethod(dm)
            }
            const shippingName = (orderJson?.order?.shipping?.name ?? '').toString()
            const shippingEmail = (orderJson?.order?.shipping?.email ?? '').toString()
            const shippingCuit = (orderJson?.order?.shipping?.cuit ?? '').toString()
            const email = (orderJson?.order?.userEmail ?? shippingEmail ?? '').toString()
            setBuyerName(shippingName)
            setBuyerEmail(email)
            setBuyerCuit(shippingCuit)
            const itemsRaw = Array.isArray(orderJson?.order?.items) ? orderJson.order.items : []
            const itemsSanitized = itemsRaw
              .filter((i: any) => i && typeof i.name === 'string')
              .map((i: any) => ({
                name: String(i.name),
                quantity: Math.max(1, Math.floor(Number(i.quantity ?? 1))),
              }))
            setOrderItems(itemsSanitized)
          }
        }
        // En la pantalla de éxito no mostramos toast de “carrito vaciado”.
        clearCart({ silent: true })
      } catch (e: any) {
        if (cancelled) return
        setSyncError(e?.message ?? 'Error al confirmar el pedido')
      } finally {
        if (cancelled) return
        setSyncing(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [canSync, paymentId, orderId, clearCart])

  const whatsappPhone =
    (process.env.NEXT_PUBLIC_COMPANY_WHATSAPP || '').trim() || '5493515900630'
  const whatsappText = useMemo(() => {
    const displayOrder = orderNumber ? `#${orderNumber}` : orderId ? orderId : ''
    const intro = `Hola COP.`
    const who =
      buyerName || buyerEmail
        ? `Soy ${buyerName || 'un cliente'}${buyerEmail ? ` (${buyerEmail})` : ''}.`
        : ''
    const cuitLine = buyerCuit ? `CUIT: ${buyerCuit}.` : ''
    const orderLine = displayOrder ? `Pedido: ${displayOrder}.` : ''
    const itemsLines =
      orderItems && orderItems.length > 0
        ? ['Productos:', ...orderItems.map((i) => `- ${i.name} x ${i.quantity}`)].join('\n')
        : ''
    const closing =
      deliveryMethod === 'PICKUP_FACTORY'
        ? 'Quiero acordar el retiro por fábrica.'
        : 'Quiero acordar el envío.'

    return [intro, who, cuitLine, orderLine, itemsLines, closing].filter(Boolean).join('\n')
  }, [buyerName, buyerEmail, buyerCuit, orderNumber, orderId, orderItems, deliveryMethod])
  const whatsappUrl = useMemo(
    () => buildWhatsAppUrl({ phone: whatsappPhone, text: whatsappText }),
    [whatsappPhone, whatsappText]
  )
  const whatsappCtaLabel =
    deliveryMethod === 'PICKUP_FACTORY'
      ? 'Acordar retiro'
      : deliveryMethod === 'AGREE_WITH_COMPANY'
        ? 'Acordar envío'
        : null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Pago Exitoso!
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Tu pedido ha sido procesado correctamente. Recibirás un email de confirmación en breve.
        </p>

        {syncing ? (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 font-semibold">Confirmando tu pedido...</p>
            <p className="text-xs text-blue-900/80">
              Esto puede tardar unos segundos mientras verificamos el pago.
            </p>
          </div>
        ) : syncError ? (
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-900 font-semibold">Tu pago fue recibido</p>
            <p className="text-xs text-yellow-900/80">
              No pudimos validar el pedido automáticamente todavía. Entrá en “Mis pedidos” y
              refrescá en unos segundos.
            </p>
            <p className="text-xs text-yellow-900/80 mt-2">{syncError}</p>
          </div>
        ) : orderStatus ? (
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-900 font-semibold">Pedido confirmado</p>
            <p className="text-xs text-green-900/80">Estado: {orderStatus}</p>
          </div>
        ) : null}

        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <p className="text-sm text-gray-600">
              <strong>Pedido:</strong> {orderNumber ? `#${orderNumber}` : orderId}
            </p>
          </div>
        )}

        {paymentId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>ID de Pago:</strong> {paymentId}
            </p>
          </div>
        )}

        {deliveryMethod === 'PICKUP_FACTORY' ? (
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-900 font-semibold">Entrega: Retiro en fábrica</p>
            <p className="text-xs text-blue-900/80">
              Dirección: {factoryAddressLine1}, {factoryAddressLine2}.
            </p>
            <p className="text-xs text-blue-900/80 mt-2">
              Importante: para coordinar el retiro, el contacto por WhatsApp es <span className="font-semibold">obligatorio</span>.
            </p>
          </div>
        ) : deliveryMethod === 'AGREE_WITH_COMPANY' ? (
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-900 font-semibold">Entrega: Envío a coordinar</p>
            <p className="text-xs text-blue-900/80">
              El costo del envío se acuerda con COP una vez realizada la compra.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/pedidos"
            className="inline-flex items-center justify-center space-x-2 bg-black text-white px-6 py-3 border-2 border-black hover:bg-gray-900 transition"
          >
            <Package className="w-5 h-5" />
            <span>Ver Mis Pedidos</span>
          </Link>
          {whatsappUrl && whatsappCtaLabel ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 bg-white text-black px-6 py-3 border-2 border-black hover:bg-gray-100 transition"
              title="Abrir WhatsApp para coordinar"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{whatsappCtaLabel}</span>
            </a>
          ) : null}
          <Link
            href="/"
            className="inline-flex items-center justify-center space-x-2 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            <Home className="w-5 h-5" />
            <span>Volver al Inicio</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <Suspense fallback={
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-pulse">
              <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
            </div>
          </div>
        </div>
      }>
        <CheckoutSuccessContent />
      </Suspense>
      <Footer />
    </main>
  )
}

