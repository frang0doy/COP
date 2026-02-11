import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const BodySchema = z.object({
  customerType: z.enum(['RETAIL', 'WHOLESALE']),
  cuit: z.string().max(40).optional(),
})

function normalizeCuit(raw: string) {
  return String(raw || '').replace(/\D+/g, '').trim()
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const json = await req.json()
    const data = BodySchema.parse(json)

    const customerType = data.customerType
    const cuit = normalizeCuit(data.cuit ?? '')

    if (customerType === 'WHOLESALE' && !cuit) {
      return NextResponse.json({ error: 'El CUIT es obligatorio para mayoristas' }, { status: 400 })
    }

    let wholesaleTier: 'NEW' | 'HISTORICAL' | null = null
    let wholesaleDiscountPercent: number | null = null

    if (customerType === 'WHOLESALE') {
      const historical = await prisma.wholesaleHistoricalCuit.findUnique({
        where: { cuit },
        select: { discountPercent: true },
      })
      if (historical) {
        wholesaleTier = 'HISTORICAL'
        wholesaleDiscountPercent = historical.discountPercent
      } else {
        wholesaleTier = 'NEW'
        wholesaleDiscountPercent = 10
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data:
        customerType === 'WHOLESALE'
          ? {
              customerType: 'WHOLESALE' as any,
              cuit,
              wholesaleStatus: 'APPROVED' as any,
              wholesaleTier: wholesaleTier as any,
              wholesaleDiscountPercent,
            }
          : {
              customerType: 'RETAIL' as any,
              wholesaleStatus: null,
              wholesaleTier: null,
              wholesaleDiscountPercent: null,
            },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        customerType: true,
        wholesaleStatus: true,
        wholesaleTier: true,
        wholesaleDiscountPercent: true,
        cuit: true,
      },
    })

    return NextResponse.json({ user })
  } catch (e: any) {
    const message = e?.name === 'ZodError' ? 'Datos inválidos' : e?.message ?? 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

