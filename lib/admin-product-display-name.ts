import { getTechnicalSummaryById } from '@/components/products/catalog'

/**
 * Por SKU (mayúsculas, sin espacios). Se evalúa antes que por id — útil si el id no coincide con el seed.
 */
const ADMIN_DISPLAY_NAME_OVERRIDE_BY_SKU: Record<string, string> = {
  'REV-003': 'Textucop Arena',
  'REV-003-BLZ-TIZ': 'Textucop Blanco',
  'REV-003-GRIS': 'Textucop Gris',
  'EST-006-GRIS-OSC': 'Cuarzotex Gris oscuro',
  'EST-006': 'Cuarzotex Gris',
  'EST-006-BLANCO': 'Cuarzotex Blanco',
  'EST-006-CHUK': 'Cuarzotex Chukum',
  'LAC-001': 'Laca poliuretánica Mate - transparente 4 lt',
  'LAC-002': 'Laca poliuretánica Brillosa - transparente 4 lt',
  'SEL-003': 'Plastibond - transparente 10 lt',
  'SEL-000': 'Plasticop - Azul 10 lt',
  'ADH-005': 'pastina impermeable - Blanca',
  'EST-002': 'Concreto Aparente Natural',
  'EST-005': 'Pasta Chukum - Chukum',
  'MAL-001': 'Malla Fibra de Vidrio - Rollo 50 mts',
  'MAL-001-MT': 'Malla Fibra de Vidrio - x metro',
}

/**
 * Nombre completo mostrado en Admin productos. Tiene prioridad sobre BD, sufijos y ficha.
 * No cambia la tienda ni la base de datos.
 */
const ADMIN_DISPLAY_NAME_OVERRIDE_BY_ID: Partial<Record<number, string>> = {
  // Laca 4 lt (catálogo id 34 / LAC-001): la ficha solo añade “transparente”, sin litros.
  34: 'Laca poliuretánica Mate - transparente 4 lt',
  35: 'Laca poliuretánica Brillosa - transparente 4 lt',
  // Plastibond 10 lt (id 33 / SEL-003) y Plasticop 10 lt (id 15 / SEL-000).
  33: 'Plastibond - transparente 10 lt',
  15: 'Plasticop - Azul 10 lt',
  // Adhesivos / estucados (ids del catálogo seed).
  5: 'pastina impermeable - Blanca', // ADH-005
  10: 'Concreto Aparente Natural', // EST-002
  13: 'Pasta Chukum - Chukum', // EST-005
}

/** Productos sin campo `colores` en ficha: sufijo fijo solo para el panel admin. */
const ADMIN_FALLBACK_SUFFIX_BY_ID: Record<number, string> = {
  42: 'Kit (varios ítems)',
}

/**
 * La ficha suele listar **todos** los colores de la línea; si en BD hay una sola fila,
 * no debemos pegar esa lista en el admin (confunde con precio/stock únicos).
 * Cuando exista una fila por color, el nombre en BD ya trae "Familia - Color".
 */
function coloresListaVariasOpcionesEnFicha(raw: string): boolean {
  const t = raw.trim().replace(/\.\s*$/, '')
  if (!t) return false
  if (/[,;]/.test(t)) return true
  if (/\//.test(t)) return true
  if (/\s+y\s+/i.test(t)) return true
  if (/\s+(o|u)\s+/i.test(t)) return true
  return false
}

/**
 * Nombre para el admin: "Producto - color u opción" según la ficha (colores),
 * solo cuando la ficha describe **un** color/presentación y no una gama completa.
 * Si el nombre en BD ya trae variante ("Familia - X"), no se modifica.
 */
export function getAdminProductDisplayName(product: { id: number | string; name: string; sku?: string | null }): string {
  const skuKey = String(product.sku ?? '')
    .trim()
    .toUpperCase()
  const forcedSku = skuKey ? ADMIN_DISPLAY_NAME_OVERRIDE_BY_SKU[skuKey]?.trim() : ''
  if (forcedSku) return forcedSku

  const idNum = Number(product.id)
  const forcedId = Number.isFinite(idNum) ? ADMIN_DISPLAY_NAME_OVERRIDE_BY_ID[idNum]?.trim() : ''
  if (forcedId) return forcedId

  const name = (product.name ?? '').trim()
  if (!name) return ''

  if (/\s[-–—]\s/.test(name)) {
    return name
  }

  const ts = Number.isFinite(idNum) ? getTechnicalSummaryById(idNum) : undefined
  const raw = ts?.colores?.trim()
  if (raw && !coloresListaVariasOpcionesEnFicha(raw)) {
    const colores = raw.replace(/\s*\.\s*$/, '')
    return `${name} - ${colores}`
  }

  const fb = Number.isFinite(idNum) ? ADMIN_FALLBACK_SUFFIX_BY_ID[idNum] : undefined
  if (fb) {
    return `${name} - ${fb}`
  }

  return name
}
