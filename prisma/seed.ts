import { prisma } from '../lib/prisma'
import { PRODUCTS } from '../components/products/catalog'

function toPrismaJson<T>(value: T): T {
  // Prisma no acepta `undefined` dentro de JSON; esto lo limpia.
  return JSON.parse(JSON.stringify(value))
}

async function main() {
  console.log(`Seedeando ${PRODUCTS.length} productos...`)

  // Mantener un identificador estable para cada producto.
  // Si el catálogo trae `sku`, lo usamos; si no, derivamos uno estable desde el ID.
  const ordered = [...PRODUCTS].sort((a, b) => a.id - b.id)

  for (const p of ordered) {
    const sku = (p as any).sku?.trim?.() ? (p as any).sku.trim() : `COP-${String(p.id).padStart(2, '0')}`
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        sku,
        name: p.name,
        description: p.description,
        category: p.category,
        // No pisamos price/stock en updates: en producción pueden venir de importación/BD real.
        image: p.image,
        isNew: Boolean(p.isNew),
        technicalSheet: p.technicalSheet,
        technicalSummary: p.technicalSummary ? toPrismaJson(p.technicalSummary) : undefined,
      },
      create: {
        id: p.id,
        sku,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        stock: p.stock,
        image: p.image,
        isNew: Boolean(p.isNew),
        technicalSheet: p.technicalSheet,
        technicalSummary: p.technicalSummary ? toPrismaJson(p.technicalSummary) : undefined,
      },
    })
  }

  console.log('Seed terminado.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

