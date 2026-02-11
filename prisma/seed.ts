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

  console.log('Seedeando CUITs mayoristas históricos...')
  const historicalCuists: Array<{ cuit: string; discountPercent: number }> = [
    // Nota: en la imagen hay 2 filas con CUIT pero sin descuento visible.
    // Para no cargar datos incorrectos, esas filas NO se insertan acá.
    { cuit: '30718555996', discountPercent: 20 },
    { cuit: '20312254337', discountPercent: 10 },
    { cuit: '20264536627', discountPercent: 10 },
    { cuit: '30717332497', discountPercent: 20 },
    { cuit: '30718903838', discountPercent: 10 },
    { cuit: '30714199664', discountPercent: 20 },
    { cuit: '27256107231', discountPercent: 10 },
    { cuit: '20176757869', discountPercent: 20 },
    { cuit: '30716042428', discountPercent: 20 },
    { cuit: '30717584887', discountPercent: 5 },
    { cuit: '30708805803', discountPercent: 25 },
    { cuit: '33717534579', discountPercent: 15 },
    { cuit: '30716232774', discountPercent: 25 },
    { cuit: '27368493614', discountPercent: 30 },
  ]

  for (const h of historicalCuists) {
    const cuit = String(h.cuit || '').replace(/\D+/g, '').trim()
    if (!cuit) continue
    const discountPercent = Math.min(100, Math.max(0, Math.floor(Number(h.discountPercent))))
    await prisma.wholesaleHistoricalCuit.upsert({
      where: { cuit },
      update: { discountPercent },
      create: { cuit, discountPercent },
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

