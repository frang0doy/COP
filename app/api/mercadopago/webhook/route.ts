import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { confirmOrder, type OrderConfirmStatus } from '@/lib/orders'
import { maybeSendOrderApprovedEmail } from '@/lib/order-email'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: { timeout: 5000 },
})

function mapMpStatus(status?: string): OrderConfirmStatus {
  const s = (status ?? '').toLowerCase()
  if (s === 'approved') return 'APPROVED'
  if (s === 'rejected' || s === 'cancelled') return 'REJECTED'
  return 'PENDING'
}

function timingSafeEqualHex(a: string, b: string) {
  try {
    const aBuf = Buffer.from(a, 'hex')
    const bBuf = Buffer.from(b, 'hex')
    if (aBuf.length !== bBuf.length) return false
    return crypto.timingSafeEqual(aBuf, bBuf)
  } catch {
    return false
  }
}

function parseSignatureHeader(headerValue: string | null): { ts?: string; v1?: string } {
  if (!headerValue) return {}
  const parts = headerValue.split(',')
  let ts: string | undefined
  let v1: string | undefined
  for (const p of parts) {
    const [kRaw, vRaw] = p.split('=', 2)
    const k = (kRaw ?? '').trim()
    const v = (vRaw ?? '').trim()
    if (!k || !v) continue
    if (k === 'ts') ts = v
    if (k === 'v1') v1 = v
  }
  return { ts, v1 }
}

function buildManifest(params: { dataId?: string; requestId?: string; ts?: string }) {
  // Template oficial: `id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];`
  // Si faltan campos, se omiten.
  const pieces: string[] = []
  if (params.dataId) pieces.push(`id:${params.dataId}`)
  if (params.requestId) pieces.push(`request-id:${params.requestId}`)
  if (params.ts) pieces.push(`ts:${params.ts}`)
  return pieces.length ? `${pieces.join(';')};` : ''
}

function verifyWebhookSignature(req: NextRequest, dataIdFromUrl?: string) {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    // En producción lo exigimos; en dev dejamos pasar para facilitar pruebas locales.
    if (process.env.NODE_ENV === 'production') return false
    return true
  }

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id') || ''
  const { ts, v1 } = parseSignatureHeader(xSignature)
  if (!ts || !v1 || !xRequestId) return false

  // MP indica que si data.id es alfanumérico, debe ir en lowercase.
  const dataId = (dataIdFromUrl ?? '').trim()
  const normalizedDataId = dataId ? dataId.toLowerCase() : ''

  const manifest = buildManifest({ dataId: normalizedDataId, requestId: xRequestId, ts })
  if (!manifest) return false

  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  // Tolerancia opcional de tiempo (segundos)
  const tolerance = Number(process.env.MP_WEBHOOK_TOLERANCE_SECONDS ?? '300')
  const nowSec = Math.floor(Date.now() / 1000)
  const tsNum = Number(ts)
  if (Number.isFinite(tsNum) && Number.isFinite(tolerance) && tolerance > 0) {
    if (Math.abs(nowSec - tsNum) > tolerance) return false
  }

  return timingSafeEqualHex(expected, v1)
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ ok: false, error: 'MP_ACCESS_TOKEN no configurado' }, { status: 500 })
    }

    // MP manda parámetros distintos según el tipo de integración:
    // - type=payment&data.id=...
    // - topic=payment&id=...
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || searchParams.get('topic')

    if (type !== 'payment') {
      // Ignoramos otros eventos (merchant_order, etc.)
      return NextResponse.json({ ok: true })
    }

    const dataIdUrl = searchParams.get('data.id') || searchParams.get('id') || ''
    if (!verifyWebhookSignature(req, dataIdUrl)) {
      return NextResponse.json({ ok: false, error: 'Firma inválida' }, { status: 401 })
    }

    const json = await req.json().catch(() => ({} as any))
    const paymentId =
      searchParams.get('id') ||
      searchParams.get('data.id') ||
      json?.data?.id ||
      json?.id

    if (!paymentId) {
      return NextResponse.json({ ok: false, error: 'paymentId faltante' }, { status: 400 })
    }

    const payment = new Payment(client)
    const paymentInfo: any = await payment.get({ id: paymentId })

    const orderId: string | undefined =
      paymentInfo?.external_reference ||
      paymentInfo?.metadata?.orderId ||
      paymentInfo?.metadata?.order_id

    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'external_reference faltante' }, { status: 400 })
    }

    const status = mapMpStatus(paymentInfo?.status)

    await confirmOrder({
      orderId,
      paymentId: String(paymentId),
      status,
    })

    if (status === 'APPROVED') {
      // No hacemos fallar el webhook si el email falla (MP reintenta y eso puede duplicar eventos).
      try {
        await maybeSendOrderApprovedEmail(orderId)
      } catch (e) {
        console.error('order-email webhook error:', e)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('MP webhook error:', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'Error' }, { status: 500 })
  }
}

export async function GET(_req: NextRequest) {
  return NextResponse.json({ ok: true })
}

