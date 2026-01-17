import { prisma } from '../lib/prisma'
import { PRODUCTS } from '../components/products/catalog'

function toPrismaJson<T>(value: T): T {
  // Prisma no acepta `undefined` dentro de JSON; esto lo limpia.
  return JSON.parse(JSON.stringify(value))
}

function copSku(index1Based: number) {
  // Formato pedido: COP-01 ... COP-40
  return `COP-${String(index1Based).padStart(2, '0')}`
}

async function main() {
  console.log(`Seedeando ${PRODUCTS.length} productos...`)

  // Asignamos SKUs COP-01.. en un orden estable (por id asc).
  const ordered = [...PRODUCTS].sort((a, b) => a.id - b.id)

  for (let i = 0; i < ordered.length; i++) {
    const p = ordered[i]
    const sku = copSku(i + 1)
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
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

