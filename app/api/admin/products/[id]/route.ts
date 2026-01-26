import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false as const, status: 401, error: 'No autenticado' }
  if (!isAdminEmail(session.user.email)) return { ok: false as const, status: 403, error: 'No autorizado' }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  })

  if (!me || me.role !== 'ADMIN') {
    return { ok: false as const, status: 403, error: 'No autorizado' }
  }

  return { ok: true as const, userId: me.id }
}

const UpdateSchema = z.object({
  sku: z.string().min(1).max(80).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.string().min(1).max(200).optional(),
  price: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  image: z.string().max(500).optional().nullable(),
  isNew: z.boolean().optional(),
  technicalSheet: z.string().max(500).optional().nullable(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status })

  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    const json = await req.json()
    const data = UpdateSchema.parse(json)

    const updated = await prisma.product.update({
      where: { id },
      data: {
        sku: data.sku?.trim(),
        name: data.name?.trim(),
        description: data.description?.trim(),
        category: data.category?.trim(),
        price: data.price,
        stock: data.stock,
        image: data.image ?? undefined,
        isNew: typeof data.isNew === 'boolean' ? data.isNew : undefined,
        technicalSheet: data.technicalSheet ?? undefined,
      },
    })

    return NextResponse.json({ product: updated })
  } catch (e: any) {
    const message = e?.name === 'ZodError' ? 'Datos inválidos' : e?.message ?? 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status })

  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

