import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = (searchParams.get('wholesaleStatus') || '').trim().toUpperCase()

  const where =
    status === 'PENDING' || status === 'APPROVED'
      ? { customerType: 'WHOLESALE' as any, wholesaleStatus: status as any }
      : undefined

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      cuit: true,
      country: true,
      customerType: true,
      wholesaleStatus: true,
      wholesaleTier: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ users })
}

