import { prisma } from '../lib/prisma'
import { PRODUCTS } from '../components/products/catalog'

function toPrismaJson<T>(value: T): T {
  // Prisma no acepta `undefined` dentro de JSON; esto lo limpia.
  return JSON.parse(JSON.stringify(value))
}

async function main() {
  console.log(`Seedeando ${PRODUCTS.length} productos...`)

  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        sku: p.sku,
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
      create: {
        id: p.id,
        sku: p.sku,
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

