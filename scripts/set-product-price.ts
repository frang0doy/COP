import process from 'node:process'
import { prisma } from '../lib/prisma'

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) continue
    out[key] = value
    i++
  }
  return out
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const id = Number(args.id)
  const price = Number(args.price)

  if (!Number.isFinite(id)) throw new Error('Falta/invalid --id')
  if (!Number.isFinite(price)) throw new Error('Falta/invalid --price')

  const updated = await prisma.product.update({
    where: { id: Math.trunc(id) },
    data: { price: Math.max(0, Math.round(price)) },
    select: { id: true, name: true, price: true, stock: true },
  })

  console.log('OK', updated)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

