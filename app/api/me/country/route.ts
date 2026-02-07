import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const BodySchema = z.object({
  // Por ahora solo AR está disponible para selección en UI.
  country: z.literal('AR'),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const json = await req.json()
    const data = BodySchema.parse(json)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { country: data.country as any },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        country: true,
      },
    })

    return NextResponse.json({ user })
  } catch (e: any) {
    const message = e?.name === 'ZodError' ? 'Datos inválidos' : e?.message ?? 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

