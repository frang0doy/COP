import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'

// Next.js usa `.env.local`; `import 'dotenv/config'` solo lee `.env`.
loadEnv({ path: resolve(process.cwd(), '.env') })
loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true })

type VariantDef = {
  sku: string
  name: string
}

type GroupDef = {
  baseSku: string
  matchNameIncludes: string[]
  /** Si el nombre contiene alguno de estos fragmentos, no se usa como base (ej. TEXTUCOP vs acrílico). */
  excludeNameIncludes?: string[]
  variants: VariantDef[]
}

const PALETTE_7: { label: string; skuSuffix: string }[] = [
  { label: 'Blanco', skuSuffix: '' },
  { label: 'Habano', skuSuffix: '-HABANO' },
  { label: 'Serrano', skuSuffix: '-SERRANO' },
  { label: 'Arena', skuSuffix: '-ARENA' },
  { label: 'Gris eclipse', skuSuffix: '-GRI-ECL' },
  { label: 'Gris portland', skuSuffix: '-GRI-PTL' },
  { label: 'Verde alpes', skuSuffix: '-VD-ALP' },
]

function palette7Variants(baseSku: string, family: string): VariantDef[] {
  return PALETTE_7.map(({ label, skuSuffix }) => ({
    sku: skuSuffix ? `${baseSku}${skuSuffix}` : baseSku,
    name: `${family} - ${label}`,
  }))
}

const GROUPS: GroupDef[] = [
  {
    baseSku: 'SEL-004',
    matchNameIncludes: ['fondo cop'],
    variants: palette7Variants('SEL-004', 'Fondo Cop'),
  },
  {
    baseSku: 'SEL-001',
    matchNameIncludes: ['pintucop'],
    variants: palette7Variants('SEL-001', 'Pintucop'),
  },
  {
    baseSku: 'SEL-002',
    matchNameIncludes: ['mastercril'],
    variants: palette7Variants('SEL-002', 'Mastercril'),
  },
  {
    baseSku: 'IMP-004',
    matchNameIncludes: ['membrana liquida'],
    variants: [
      { sku: 'IMP-004', name: 'Membrana Líquida - Blanco' },
      { sku: 'IMP-004-ROJO-TIL', name: 'Membrana Líquida - Rojo tilcara' },
    ],
  },
  {
    baseSku: 'IMP-005',
    matchNameIncludes: ['membrana poliuretan'],
    variants: [
      { sku: 'IMP-005', name: 'Membrana Poliuretánica - Blanco' },
      { sku: 'IMP-005-ROJO-TIL', name: 'Membrana Poliuretánica - Rojo tilcara' },
    ],
  },
  {
    baseSku: 'REV-004',
    matchNameIncludes: ['stone cop'],
    variants: [
      { sku: 'REV-004', name: 'Stone COP - Dálmata' },
      { sku: 'REV-004-NEG', name: 'Stone COP - Negro' },
      { sku: 'REV-004-VER', name: 'Stone COP - Verona' },
      { sku: 'REV-004-PAR', name: 'Stone COP - Paraná' },
    ],
  },
  {
    baseSku: 'REV-003',
    matchNameIncludes: ['textucop'],
    excludeNameIncludes: ['acril'],
    variants: [
      { sku: 'REV-003', name: 'TEXTUCOP - Arena' },
      { sku: 'REV-003-BLZ-TIZ', name: 'TEXTUCOP - Blanco' },
    ],
  },
  {
    baseSku: 'REV-001',
    matchNameIncludes: ['marmoltex'],
    variants: palette7Variants('REV-001', 'Marmoltex'),
  },
  {
    baseSku: 'EST-006',
    matchNameIncludes: ['cuarzotex'],
    variants: [
      { sku: 'EST-006', name: 'CUARZOTEX - Gris natural' },
      { sku: 'EST-006-ARENA', name: 'CUARZOTEX - Arena' },
      { sku: 'EST-006-GRIS-OSC', name: 'CUARZOTEX - Gris oscuro' },
    ],
  },
  {
    baseSku: 'EST-004',
    matchNameIncludes: ['micro piscina'],
    variants: [
      { sku: 'EST-004', name: 'Micro piscinas - Blanco' },
      { sku: 'EST-004-GRIS', name: 'Micro piscinas - Gris' },
      { sku: 'EST-004-CHUK', name: 'Micro piscinas - Chukum' },
    ],
  },
  {
    baseSku: 'EST-003',
    matchNameIncludes: ['veneziano'],
    variants: [
      { sku: 'EST-003', name: 'Veneziano - Marrón' },
      { sku: 'EST-003-ROJ', name: 'Veneziano - Rojo' },
      { sku: 'EST-003-VERDE', name: 'Veneziano - Verde' },
      { sku: 'EST-003-CHUK', name: 'Veneziano - Chukum' },
      { sku: 'EST-003-AMAR', name: 'Veneziano - Amarillo' },
      { sku: 'EST-003-AZUL', name: 'Veneziano - Azul' },
      { sku: 'EST-003-GRIS', name: 'Veneziano - Gris' },
      { sku: 'EST-003-NEG', name: 'Veneziano - Negro' },
      { sku: 'EST-003-BL-MAR', name: 'Veneziano - Blanco marfil' },
    ],
  },
  {
    baseSku: 'EST-002',
    matchNameIncludes: ['concreto aparente'],
    variants: [
      { sku: 'EST-002', name: 'Concreto aparente - Natural' },
      { sku: 'EST-002-GRIS-OSC', name: 'Concreto aparente - Gris oscuro' },
      { sku: 'EST-002-BLANCO', name: 'Concreto aparente - Blanco' },
    ],
  },
  {
    baseSku: 'EST-001',
    matchNameIncludes: ['microtex'],
    variants: [
      { sku: 'EST-001', name: 'Microtex - Chukum' },
      { sku: 'EST-001-BLANC', name: 'Microtex - Blanco' },
      { sku: 'EST-001-GR-PER', name: 'Microtex - Gris perla' },
      { sku: 'EST-001-GR-PLT', name: 'Microtex - Gris plata' },
      { sku: 'EST-001-GR-OSC', name: 'Microtex - Gris oscuro' },
      { sku: 'EST-001-GR-NAT', name: 'Microtex - Gris natural' },
      { sku: 'EST-001-NEG', name: 'Microtex - Negro' },
    ],
  },
  {
    baseSku: 'ADH-005',
    matchNameIncludes: ['pastina impermeable'],
    variants: [
      { sku: 'ADH-005', name: 'Pastina Impermeable - Blanco' },
      { sku: 'ADH-005-GRIS', name: 'Pastina Impermeable - Gris' },
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
      { sku: 'REQ-002', name: 'Revoque 3 en 1 - Estándar' },
      { sku: 'REQ-002-PROY', name: 'Revoque 3 en 1 - Proyectable' },
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
  const { prisma } = await import('../lib/prisma')
  try {
  const all = await prisma.product.findMany({ orderBy: { id: 'asc' } })
  let nextId = (all[all.length - 1]?.id ?? 0) + 1

  for (const group of GROUPS) {
    const base =
      all.find((p) => p.sku === group.baseSku) ??
      all.find((p) => {
        const n = normalize(p.name)
        if (!group.matchNameIncludes.every((part) => n.includes(normalize(part)))) return false
        if (group.excludeNameIncludes?.some((ex) => n.includes(normalize(ex)))) return false
        return true
      })

    if (!base) {
      console.warn(`No encontré base para ${group.baseSku}. Se omite grupo.`)
      continue
    }

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
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
