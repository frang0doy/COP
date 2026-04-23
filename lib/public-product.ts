import type { Product } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Un solo lookup por request de listado / detalle. */
export async function shouldExposeWholesalePrice(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false
  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { customerType: true, wholesaleStatus: true },
  })
  return u?.customerType === 'WHOLESALE' && u?.wholesaleStatus === 'APPROVED'
}

/** Respuesta pública: oculta precio mayorista salvo clientes habilitados. */
export function toPublicProductJson(
  p: Product,
  opts: { includeWholesalePrice: boolean }
) {
  if (opts.includeWholesalePrice) {
    return p
  }
  const { wholesalePrice: _w, ...rest } = p
  return rest
}
