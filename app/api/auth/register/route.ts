import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(200),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const data = RegisterSchema.parse(json)

    const email = data.email.trim().toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con ese email' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        name: data.name.trim(),
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    })

    return NextResponse.json({ user })
  } catch (e: any) {
    const message =
      e?.name === 'ZodError' ? 'Datos inválidos' : e?.message ?? 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

