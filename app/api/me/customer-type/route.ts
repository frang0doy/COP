import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const BodySchema = z.object({
  customerType: z.enum(['RETAIL', 'WHOLESALE']),
  cuit: z.string().max(40).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const json = await req.json()
    const data = BodySchema.parse(json)

    const customerType = data.customerType
    const cuit = (data.cuit ?? '').trim()

    if (customerType === 'WHOLESALE' && !cuit) {
      return NextResponse.json({ error: 'El CUIT es obligatorio para mayoristas' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data:
        customerType === 'WHOLESALE'
          ? {
              customerType: 'WHOLESALE' as any,
              cuit,
              wholesaleStatus: 'PENDING' as any,
              wholesaleTier: null,
            }
          : {
              customerType: 'RETAIL' as any,
              wholesaleStatus: null,
              wholesaleTier: null,
            },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        customerType: true,
        wholesaleStatus: true,
        wholesaleTier: true,
        cuit: true,
      },
    })

    return NextResponse.json({ user })
  } catch (e: any) {
    const message = e?.name === 'ZodError' ? 'Datos inválidos' : e?.message ?? 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

