/* eslint-disable no-console */
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const root = process.cwd()
const nextDir = path.join(root, '.next')

function exists(p) {
  try {
    fs.accessSync(p)
    return true
  } catch {
    return false
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  if (!exists(nextDir)) {
    console.log('[clean-next] .next no existe, OK')
    return
  }

  console.log('[clean-next] borrando .next...')

  // En Windows + OneDrive, fs.rm/rimraf puede fallar con EPERM/EINVAL.
  // cmd rmdir suele funcionar mejor.
  if (process.platform === 'win32') {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        execSync('cmd /c "rmdir /s /q .next"', { stdio: 'ignore' })
      } catch {}
      if (!exists(nextDir)) {
        console.log('[clean-next] .next borrado (Windows)')
        return
      }
      console.log(`[clean-next] reintento ${attempt}/3...`)
      await sleep(350)
    }
    throw new Error('No se pudo borrar .next (Windows). Cerrá el dev server y reintentá.')
  }

  // *nix
  await fs.promises.rm(nextDir, { recursive: true, force: true })
  console.log('[clean-next] .next borrado')
}

main().catch((e) => {
  console.error('[clean-next] ERROR:', e?.message ?? e)
  process.exit(1)
})

