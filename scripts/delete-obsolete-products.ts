import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'

loadEnv({ path: resolve(process.cwd(), '.env') })
loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true })

/**
 * Baja productos concretos de la DB (p. ej. variantes obsoletas / pausadas de más).
 * Falla si hay líneas de pedido que referencian el producto (integridad con pedidos).
 */
const DEFAULT_IDS: number[] = [99, 106]

async function main() {
  const idsArg = process.argv[2]
  const ids = idsArg
    ? idsArg
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n))
    : DEFAULT_IDS

  if (ids.length === 0) {
    console.error('Indicá IDs: npm run delete:products -- 99,106')
    process.exit(1)
  }

  const { prisma } = await import('../lib/prisma')

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, sku: true, name: true, isActive: true },
  })

  if (products.length === 0) {
    console.log('No se encontraron productos con esos IDs. Nada que borrar.')
    await prisma.$disconnect()
    return
  }

  console.log('Productos a borrar:')
  for (const p of products) {
    console.log(`  id=${p.id} sku=${p.sku} isActive=${p.isActive} ${p.name}`)
  }

  const missing = ids.filter((id) => !products.some((p) => p.id === id))
  if (missing.length) {
    console.warn('IDs no encontrados (omitidos):', missing.join(', '))
  }

  const inOrders = await prisma.orderItem.findMany({
    where: { productId: { in: products.map((p) => p.id) } },
    select: { productId: true, orderId: true },
    take: 5,
  })

  if (inOrders.length > 0) {
    const count = await prisma.orderItem.count({
      where: { productId: { in: products.map((p) => p.id) } },
    })
    console.error(
      `No se pueden borrar: hay ${count} línea(s) de pedido vinculadas. Revisar pedidos admin o contactar desarrollo.`
    )
    console.error('Muestras (productId, orderId):', inOrders)
    process.exit(1)
  }

  const result = await prisma.product.deleteMany({
    where: { id: { in: products.map((p) => p.id) } },
  })
  console.log(`Listo. Eliminados: ${result.count} producto(s).`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
