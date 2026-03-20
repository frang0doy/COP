import 'dotenv/config'
import { prisma } from '../lib/prisma'

type VariantDef = {
  sku: string
  name: string
}

type GroupDef = {
  baseSku: string
  matchNameIncludes: string[]
  variants: VariantDef[]
}

const GROUPS: GroupDef[] = [
  {
    baseSku: 'ADH-005',
    matchNameIncludes: ['pastina impermeable'],
    variants: [
      { sku: 'ADH-005', name: 'Pastina Impermeable - Blanco' },
      { sku: 'ADH-005-GRIS', name: 'Pastina Impermeable - Gris' },
    ],
  },
  {
    baseSku: 'EST-002',
    matchNameIncludes: ['concreto aparente'],
    variants: [
      { sku: 'EST-002', name: 'Concreto Aparente - Natural' },
      { sku: 'EST-002-GRIS-OSC', name: 'Concreto Aparente - Gris Oscuro' },
      { sku: 'EST-002-BLANCO', name: 'Concreto Aparente - Blanco' },
    ],
  },
  {
    baseSku: 'EST-004',
    matchNameIncludes: ['micro piscina', 'micro piscinas'],
    variants: [
      { sku: 'EST-004', name: 'Micro Piscina - Blanco' },
      { sku: 'EST-004-GRIS', name: 'Micro Piscina - Gris' },
    ],
  },
  {
    baseSku: 'EST-006',
    matchNameIncludes: ['cuarzotex'],
    variants: [
      { sku: 'EST-006', name: 'Cuarzotex - Gris Oscuro' },
      { sku: 'EST-006-GRIS', name: 'Cuarzotex - Gris' },
    ],
  },
  {
    baseSku: 'SEL-000',
    matchNameIncludes: ['plasticop'],
    variants: [
      { sku: 'SEL-000', name: 'Plasticop - Balde 10 lt' },
      { sku: 'SEL-000-4LT', name: 'Plasticop - Balde 4 lt' },
    ],
  },
  {
    baseSku: 'SEL-003',
    matchNameIncludes: ['plastibond'],
    variants: [
      { sku: 'SEL-003', name: 'Plastibond - Balde 10 lt' },
      { sku: 'SEL-003-4LT', name: 'Plastibond - Balde 4 lt' },
    ],
  },
  {
    baseSku: 'LAC-001',
    matchNameIncludes: ['laca', 'mate'],
    variants: [
      { sku: 'LAC-001', name: 'Laca Poliuretanica Mate - Balde 4 lt' },
      { sku: 'LAC-001-1LT', name: 'Laca Poliuretanica Mate - Balde 1 lt' },
    ],
  },
  {
    baseSku: 'LAC-002',
    matchNameIncludes: ['laca', 'brillosa'],
    variants: [
      { sku: 'LAC-002', name: 'Laca Poliuretanica Brillosa - Balde 4 lt' },
      { sku: 'LAC-002-1LT', name: 'Laca Poliuretanica Brillosa - Balde 1 lt' },
    ],
  },
  {
    baseSku: 'REQ-002',
    matchNameIncludes: ['revoque 3 en 1', 'revoque 3en1'],
    variants: [
      { sku: 'REQ-002', name: 'Revoque 3 en 1' },
      { sku: 'REQ-002-PROY', name: 'Revoque 3 en 1 Proyectable' },
    ],
  },
]

function normalize(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

async function main() {
  const all = await prisma.product.findMany({ orderBy: { id: 'asc' } })
  let nextId = (all[all.length - 1]?.id ?? 0) + 1

  for (const group of GROUPS) {
    const base =
      all.find((p) => p.sku === group.baseSku) ??
      all.find((p) => {
        const n = normalize(p.name)
        return group.matchNameIncludes.every((part) => n.includes(normalize(part)))
      })

    if (!base) {
      console.warn(`No encontré base para ${group.baseSku}. Se omite grupo.`)
      continue
    }

    // La variante principal reaprovecha el producto base para no romper referencias.
    const primary = group.variants[0]
    await prisma.product.update({
      where: { id: base.id },
      data: {
        sku: primary.sku,
        name: primary.name,
      },
    })

    for (const variant of group.variants.slice(1)) {
      const existing = await prisma.product.findUnique({ where: { sku: variant.sku } })
      if (existing) {
        await prisma.product.update({
          where: { sku: variant.sku },
          data: {
            name: variant.name,
            category: base.category,
            description: base.description,
            image: base.image,
            technicalSheet: base.technicalSheet,
            technicalSummary: base.technicalSummary as any,
            isActive: true,
          },
        })
        continue
      }

      await prisma.product.create({
        data: {
          id: nextId++,
          sku: variant.sku,
          name: variant.name,
          description: base.description,
          category: base.category,
          price: base.price,
          stock: 0,
          image: base.image,
          isNew: base.isNew,
          technicalSheet: base.technicalSheet,
          technicalSummary: base.technicalSummary as any,
          isActive: true,
        },
      })
    }
  }

  console.log('Variantes configuradas correctamente.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

