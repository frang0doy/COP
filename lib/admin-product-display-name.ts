import { getTechnicalSummaryById } from '@/components/products/catalog'

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
export function getAdminProductDisplayName(product: { id: number; name: string }): string {
  const name = (product.name ?? '').trim()
  if (!name) return ''

  if (/\s[-–—]\s/.test(name)) {
    return name
  }

  const ts = getTechnicalSummaryById(product.id)
  const raw = ts?.colores?.trim()
  if (raw && !coloresListaVariasOpcionesEnFicha(raw)) {
    const colores = raw.replace(/\s*\.\s*$/, '')
    return `${name} - ${colores}`
  }

  const fb = ADMIN_FALLBACK_SUFFIX_BY_ID[product.id]
  if (fb) {
    return `${name} - ${fb}`
  }

  return name
}
