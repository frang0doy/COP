import { PrismaClient, type UserRole } from '@prisma/client'
import fs from 'node:fs'
import path from 'node:path'

function loadEnvFileIfMissing() {
  // Prisma necesita DATABASE_URL en runtime. `tsx`/node no siempre cargan `.env.local` automáticamente.
  if (process.env.DATABASE_URL) return

  const candidates = ['.env.local', '.env']
  for (const name of candidates) {
    const file = path.join(process.cwd(), name)
    if (!fs.existsSync(file)) continue

    const raw = fs.readFileSync(file, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (!m) continue

      const key = m[1]
      let value = m[2] ?? ''

      // Removemos comillas simples/dobles alrededor (ej: FOO="bar")
      value = value.trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      if (!process.env[key]) process.env[key] = value
    }
  }
}

const OWNER_EMAIL = process.env.OWNER_EMAIL?.trim().toLowerCase() || 'franciscogodoy_@hotmail.com'
const APPLY = process.argv.includes('--apply')
const DRY_RUN = !APPLY

async function main() {
  loadEnvFileIfMissing()
  const prisma = new PrismaClient()

  try {
    const owner = await prisma.user.findFirst({
      where: { email: { equals: OWNER_EMAIL, mode: 'insensitive' } },
      select: { id: true, email: true, role: true },
    })

    if (!owner) {
      throw new Error(`No existe el usuario admin con email: ${OWNER_EMAIL}`)
    }

    const beforeOrders = await prisma.order.count()
    const beforeUsers = await prisma.user.count()
    const otherUsersCount = await prisma.user.count({ where: { email: { not: OWNER_EMAIL } } })

    console.log(`OWNER_EMAIL: ${OWNER_EMAIL}`)
    console.log(`Antes -> orders: ${beforeOrders}, users: ${beforeUsers} (otros: ${otherUsersCount})`)

    if (DRY_RUN) {
      console.log('Modo DRY_RUN: no se borra nada. Ejecutá con: --apply')
      return
    }

    await prisma.$transaction(async (tx) => {
      // Borra pedidos: OrderItem cae por `onDelete: Cascade`.
      await tx.order.deleteMany({})

      // Deja solo el admin.
      await tx.user.deleteMany({
        where: { id: { not: owner.id } },
      })

      // Asegura que el admin tenga rol ADMIN.
      if (owner.role !== ('ADMIN' as UserRole)) {
        await tx.user.update({
          where: { id: owner.id },
          data: { role: 'ADMIN' as any },
        })
      }
    })

    const afterOrders = await prisma.order.count()
    const afterUsers = await prisma.user.count()
    console.log(`Después -> orders: ${afterOrders}, users: ${afterUsers}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

