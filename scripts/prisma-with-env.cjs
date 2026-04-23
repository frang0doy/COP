/**
 * Carga `.env` y `.env.local` (igual que Next) y ejecuta el CLI de Prisma.
 * Uso: node scripts/prisma-with-env.cjs db push
 */
const { config } = require('dotenv')
const { resolve } = require('path')
const { spawnSync } = require('child_process')

config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env.local'), override: true })

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Uso: node scripts/prisma-with-env.cjs <comando prisma...>  ej: db push')
  process.exit(1)
}

const r = spawnSync('npx', ['prisma', ...args], { stdio: 'inherit', shell: true, env: process.env })
process.exit(r.status === null ? 1 : r.status)
