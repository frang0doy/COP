import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const UpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(40).optional(),
  cuit: z.string().max(40).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  zipCode: z.string().max(20).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const json = await req.json()
    const data = UpdateSchema.parse(json)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name?.trim(),
        phone: data.phone?.trim(),
        cuit: data.cuit?.trim(),
        address: data.address?.trim(),
        city: data.city?.trim(),
        state: data.state?.trim(),
        zipCode: data.zipCode?.trim(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        cuit: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
      },
    })

    return NextResponse.json({ user })
  } catch (e: any) {
    const message =
      e?.name === 'ZodError' ? 'Datos inválidos' : e?.message ?? 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

