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

  if (!me) {
    return { ok: false as const, status: 403, error: 'No autorizado' }
  }

  // Si el email está whitelisteado pero el rol aún no se actualizó, lo promovemos acá.
  if (me.role !== 'ADMIN') {
    await prisma.user.update({ where: { id: me.id }, data: { role: 'ADMIN' as any } })
  }

  return { ok: true as const, userId: me.id }
}

const UpsertSchema = z.object({
  id: z.number().int().positive(),
  sku: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().min(1).max(200),
  price: z.number().int().nonnegative(),
  wholesalePrice: z.union([z.number().int().nonnegative(), z.null()]).optional(),
  stock: z.number().int().nonnegative(),
  image: z.string().max(500).optional().nullable(),
  isNew: z.boolean().optional(),
  technicalSheet: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  const admin = await requireAdmin()
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status })

  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } })
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status })

  try {
    const json = await req.json()
    const data = UpsertSchema.parse(json)

    const created = await prisma.product.upsert({
      where: { id: data.id },
      update: {
        sku: data.sku.trim(),
        name: data.name.trim(),
        description: data.description.trim(),
        category: data.category.trim(),
        price: data.price,
        wholesalePrice: data.wholesalePrice === undefined ? undefined : data.wholesalePrice,
        stock: data.stock,
        image: data.image ?? null,
        isNew: Boolean(data.isNew),
        technicalSheet: data.technicalSheet ?? null,
        isActive: typeof data.isActive === 'boolean' ? data.isActive : undefined,
      },
      create: {
        id: data.id,
        sku: data.sku.trim(),
        name: data.name.trim(),
        description: data.description.trim(),
        category: data.category.trim(),
        price: data.price,
        wholesalePrice: data.wholesalePrice === undefined ? null : data.wholesalePrice,
        stock: data.stock,
        image: data.image ?? null,
        isNew: Boolean(data.isNew),
        technicalSheet: data.technicalSheet ?? null,
        isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
      },
    })

    return NextResponse.json({ product: created })
  } catch (e: any) {
    const message = e?.name === 'ZodError' ? 'Datos inválidos' : e?.message ?? 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

