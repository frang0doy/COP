import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import * as XLSX from 'xlsx'
import { prisma } from '../lib/prisma'

type Args = {
  file: string
  sheet?: string
  skuCol?: string
  priceCol?: string
  stockCol?: string
  dryRun?: boolean
}

function parseArgs(argv: string[]): Args {
  const out: any = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    if (key === 'dry-run') {
      out.dryRun = true
      continue
    }
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) continue
    out[key] = value
    i++
  }
  if (!out.file) {
    throw new Error('Falta --file (ruta al .xlsx)')
  }
  return out as Args
}

function normKey(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function findCol(headers: string[], wanted: string[]) {
  const normalized = headers.map((h) => normKey(h))
  for (const w of wanted) {
    const idx = normalized.indexOf(normKey(w))
    if (idx >= 0) return headers[idx]
  }
  // fallback: contains
  for (const w of wanted) {
    const nw = normKey(w)
    const idx = normalized.findIndex((h) => h.includes(nw))
    if (idx >= 0) return headers[idx]
  }
  return null
}

function parseStock(v: unknown): number | null {
  if (v == null) return null
  const raw = String(v).trim()
  if (!raw) return null
  const n = Number(raw.replace(/[^\d.-]/g, ''))
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.floor(n))
}

function parsePriceARS(v: unknown): number | null {
  if (v == null) return null
  const raw = String(v).trim()
  if (!raw) return null

  // Ejemplos: "$ 12.345,67" / "12345" / "12.345" / "12,345"
  let s = raw.replace(/[^\d,.-]/g, '')

  // Si tiene coma y punto, asumimos formato AR: "." miles, "," decimales
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes(',')) {
    // si solo tiene coma, puede ser decimal o miles; asumimos decimal si hay 1 coma y 1-2 decimales
    const parts = s.split(',')
    if (parts.length === 2 && parts[1].length <= 2) {
      s = parts[0].replace(/\./g, '') + '.' + parts[1]
    } else {
      s = s.replace(/,/g, '')
    }
  } else {
    // solo puntos: pueden ser miles
    s = s.replace(/\./g, '')
  }

  const n = Number(s)
  if (!Number.isFinite(n)) return null
  // Guardamos en pesos enteros (tu modelo Product.price es Int)
  return Math.max(0, Math.round(n))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const abs = path.resolve(process.cwd(), args.file)
  if (!fs.existsSync(abs)) {
    throw new Error(`No existe el archivo: ${abs}`)
  }

  const wb = XLSX.readFile(abs, { cellDates: true })
  const sheetName = args.sheet ?? wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  if (!ws) throw new Error(`No existe la hoja "${sheetName}"`)

  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' })
  if (rows.length === 0) {
    console.log('No hay filas para importar.')
    return
  }

  const headers = Object.keys(rows[0])
  const skuCol =
    args.skuCol ??
    findCol(headers, ['sku', 'codigo', 'código', 'codigo sku', 'cod sku'])
  const priceCol =
    args.priceCol ??
    findCol(headers, ['precio', 'price', 'precio ars', 'precio unitario'])
  const stockCol =
    args.stockCol ??
    findCol(headers, ['stock', 'existencia', 'inventario', 'cantidad'])

  if (!skuCol) throw new Error('No pude detectar la columna SKU. Pasá --skuCol "NOMBRE_COLUMNA".')
  if (!priceCol) throw new Error('No pude detectar la columna PRECIO. Pasá --priceCol "NOMBRE_COLUMNA".')
  if (!stockCol) throw new Error('No pude detectar la columna STOCK. Pasá --stockCol "NOMBRE_COLUMNA".')

  console.log('Archivo:', abs)
  console.log('Hoja:', sheetName)
  console.log('Columnas detectadas:', { skuCol, priceCol, stockCol })
  console.log('Modo:', args.dryRun ? 'DRY RUN (no escribe)' : 'ACTUALIZA BD')

  let updated = 0
  let missing = 0
  let invalid = 0

  for (const r of rows) {
    const sku = String(r[skuCol] ?? '').trim()
    if (!sku) continue

    const price = parsePriceARS(r[priceCol])
    const stock = parseStock(r[stockCol])
    if (price == null || stock == null) {
      invalid++
      continue
    }

    const exists = await prisma.product.findUnique({ where: { sku } })
    if (!exists) {
      missing++
      continue
    }

    if (!args.dryRun) {
      await prisma.product.update({
        where: { sku },
        data: { price, stock },
      })
    }

    updated++
  }

  console.log('---')
  console.log('Actualizados:', updated)
  console.log('No encontrados (SKU):', missing)
  console.log('Filas inválidas:', invalid)
  console.log('---')
  console.log('Listo.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

