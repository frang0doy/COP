import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// En este proyecto el datasource es PostgreSQL (ver `prisma/schema.prisma`).
// `DATABASE_URL` debe existir en producción (Vercel). Evitamos tirar error en import
// para no romper `next build` local; el fallo será explícito al ejecutar queries.
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  console.warn('DATABASE_URL no configurada (requerida en producción)')
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

