import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const orderId = params.id?.trim()
  if (!orderId) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const isAdmin = Boolean(session.user?.email && isAdminEmail(session.user.email))

  const order = await prisma.order.findFirst({
    where: isAdmin ? { id: orderId } : { id: orderId, userId: session.user.id },
    include: { items: true },
  })

  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ order })
}

