import path from 'node:path'
import { access } from 'node:fs/promises'

// Memoiza resoluciones para no volver a consultar el filesystem en cada request.
// Nota: funciona por proceso/instancia (Vercel serverless "warm"); igual ayuda mucho en la práctica.
const resolvedImageCache = new Map<string, string | null>()

async function fileExists(publicPath: string) {
  try {
    const rel = publicPath.replace(/^\/+/, '')
    const abs = path.join(process.cwd(), 'public', rel)
    await access(abs)
    return true
  } catch {
    return false
  }
}

function swapBasename(image: string, newBasename: string) {
  const parts = image.split('/')
  parts[parts.length - 1] = newBasename
  return parts.join('/')
}

export async function resolveProductImage(image: string | null | undefined) {
  if (!image) return null

  if (resolvedImageCache.has(image)) {
    return resolvedImageCache.get(image) ?? null
  }

  // Si ya apunta a una versión nueva, dejamos así.
  if (/_nuev[oa]\./i.test(image)) {
    resolvedImageCache.set(image, image)
    return image
  }

  const filename = image.split('/').pop() ?? ''

  // Mapeos especiales por nombres históricos en BD
  const specialMap: Record<string, string> = {
    'laca_poli_mate1.png': 'laca_poli_mate_balde4_nuevo.png',
    'laca_poli_brillo1.png': 'laca_poli_brillo_balde4_nuevo.png',
    'Membrana_Poliuretánica.png': 'membrana_poliuretanica_nueva.png',
    'memb_liquida.png': 'memb_liquida_nueva.png',
  }

  const special = specialMap[filename]
  if (special) {
    const candidate = swapBasename(image, special)
    if (await fileExists(candidate)) {
      resolvedImageCache.set(image, candidate)
      return candidate
    }
  }

  // Fallback genérico: foo.png -> foo_nuevo.png / foo_nueva.png si existe
  const extMatch = filename.match(/(\.[a-z0-9]+)$/i)
  const ext = extMatch ? extMatch[1] : ''
  const base = ext ? filename.slice(0, -ext.length) : filename

  const candidateNuevo = swapBasename(image, `${base}_nuevo${ext}`)
  if (await fileExists(candidateNuevo)) {
    resolvedImageCache.set(image, candidateNuevo)
    return candidateNuevo
  }

  const candidateNueva = swapBasename(image, `${base}_nueva${ext}`)
  if (await fileExists(candidateNueva)) {
    resolvedImageCache.set(image, candidateNueva)
    return candidateNueva
  }

  // Si existe el original, lo dejamos; si no, devolvemos igual (mejor que null).
  resolvedImageCache.set(image, image)
  return image
}

