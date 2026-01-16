import { PrismaClient } from '@prisma/client'

// Fallback para desarrollo: si no existe DATABASE_URL, usamos el SQLite local.
// Esto evita que las rutas /api fallen y el frontend muestre 0 productos.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db'
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        // En local, si no existe DATABASE_URL (no hay .env.local), usamos el dev.db del root.
        url: process.env.DATABASE_URL || 'file:./dev.db',
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

