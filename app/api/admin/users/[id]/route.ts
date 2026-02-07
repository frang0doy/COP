import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  action: z.enum(['approve', 'reject']),
  tier: z.enum(['NEW', 'HISTORICAL']).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!session.user.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const userId = (params.id || '').trim()
  if (!userId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  try {
    const json = await req.json()
    const body = BodySchema.parse(json)

    if (body.action === 'approve' && !body.tier) {
      return NextResponse.json({ error: 'Falta tier (NEW/HISTORICAL)' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data:
        body.action === 'approve'
          ? {
              customerType: 'WHOLESALE' as any,
              wholesaleStatus: 'APPROVED' as any,
              wholesaleTier: body.tier as any,
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
        cuit: true,
        country: true,
        customerType: true,
        wholesaleStatus: true,
        wholesaleTier: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (e: any) {
    const message = e?.name === 'ZodError' ? 'Datos inválidos' : e?.message ?? 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

