/** Agrupa productos por familia (mismo nombre base) para selector de variantes en catálogo y detalle. */

export function stripDiacritics(input: string) {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function normText(input: string) {
  return stripDiacritics(input).toLowerCase()
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Si el nombre en BD es solo el de la familia (sin " - color"), usamos la primera variante
 * del catálogo (mismo criterio que `setup-product-variants.ts`). En el desplegable solo
 * deben verse colores/opciones, nunca "Principal" ni el nombre genérico repetido.
 */
const DEFAULT_VARIANT_WHEN_NAME_IS_ONLY_FAMILY: Record<string, string> = {
  'Pastina Impermeable': 'Blanco',
  'Concreto aparente': 'Natural',
  'Micro piscinas': 'Gris',
  CUARZOTEX: 'Gris natural',
  'Membrana Poliuretánica': 'Blanco',
  'Membrana Líquida': 'Blanco',
  'Fondo Cop': 'Blanco',
  Pintucop: 'Blanco',
  Mastercril: 'Blanco',
  'Stone COP': 'Dálmata',
  TEXTUCOP: 'Arena',
  Marmoltex: 'Blanco',
  Veneziano: 'Marrón',
  Microtex: 'Chukum',
  Plasticop: 'Balde 10 lt',
  Plastibond: 'Balde 10 lt',
  'Laca Poliuretanica Mate': 'Balde 4 lt',
  'Laca Poliuretanica Brillosa': 'Balde 4 lt',
  'Revoque 3 en 1': 'Estándar',
  'Malla Fibra de Vidrio': 'Rollo 50 mts',
}

function defaultLabelForBareFamilyName(groupBaseName: string): string {
  return DEFAULT_VARIANT_WHEN_NAME_IS_ONLY_FAMILY[groupBaseName] ?? '—'
}

/**
 * Quita el nombre de familia al inicio (sin importar mayúsculas) y separadores (-, –, —).
 * Devuelve solo el sufijo (color, presentación, etc.) o null si el nombre coincide solo con la familia.
 */
function variantSuffixAfterFamily(productName: string, groupBaseName: string): string | null {
  const raw = productName.trim()
  const base = groupBaseName.trim()
  if (!raw || !base) return null

  const tn = normText(raw)
  const bn = normText(base)
  if (tn === bn) return null

  if (!tn.startsWith(bn)) return null

  const re = new RegExp(`^${escapeRegex(base)}`, 'i')
  const rest = raw.replace(re, '').trim()
  const cleaned = rest.replace(/^[-–—.:]\s*/, '').trim()
  return cleaned.length > 0 ? cleaned : null
}

export function detectGroupBaseName(productName: string): string | null {
  const t = normText(productName)
  if (t.includes('pastina impermeable')) return 'Pastina Impermeable'
  if (t.includes('concreto aparente')) return 'Concreto aparente'
  if (t.includes('micro piscina')) return 'Micro piscinas'
  if (t.includes('cuarzotex')) return 'CUARZOTEX'
  if (t.includes('membrana poliuretan')) return 'Membrana Poliuretánica'
  if (t.includes('membrana liquida') || t.includes('membrana líquida')) return 'Membrana Líquida'
  if (t.includes('fondo cop')) return 'Fondo Cop'
  if (t.includes('pintucop')) return 'Pintucop'
  if (t.includes('mastercril')) return 'Mastercril'
  if (t.includes('stone cop')) return 'Stone COP'
  if (t.includes('textucop') && !t.includes('acril')) return 'TEXTUCOP'
  if (t.includes('marmoltex')) return 'Marmoltex'
  if (t.includes('veneziano')) return 'Veneziano'
  if (t.includes('microtex')) return 'Microtex'
  if (t.includes('plasticop')) return 'Plasticop'
  if (t.includes('plastibond')) return 'Plastibond'
  if (t.includes('laca') && t.includes('mate')) return 'Laca Poliuretanica Mate'
  if (t.includes('laca') && (t.includes('brillosa') || t.includes('brillo') || t.includes('brillos')))
    return 'Laca Poliuretanica Brillosa'
  if (t.includes('revoque 3 en 1') || t.includes('revoque 3en1')) return 'Revoque 3 en 1'
  if (t.includes('malla fibra de vidrio') || t.includes('malla de fibra de vidrio'))
    return 'Malla Fibra de Vidrio'
  return null
}

/** Texto del selector: solo color / opción (nunca el nombre base repetido). */
export function detectVariantLabel(productName: string, groupBaseName: string | null): string {
  if (!groupBaseName) return 'Única'

  const t = normText(productName)
  if (groupBaseName === 'Revoque 3 en 1') {
    return t.includes('proyectable') ? 'Proyectable' : 'Estándar'
  }

  const byStrip = variantSuffixAfterFamily(productName, groupBaseName)
  if (byStrip !== null) {
    return byStrip
  }

  if (normText(productName) === normText(groupBaseName)) {
    if (groupBaseName === 'Plasticop' || groupBaseName === 'Plastibond' || groupBaseName.startsWith('Laca')) {
      if (/\b10\s*(l|lt|lts|litros?)\b/.test(t)) return 'Balde 10 lt'
      if (/\b4\s*(l|lt|lts|litros?)\b/.test(t)) return 'Balde 4 lt'
      if (/\b1\s*(l|lt|lts|litros?)\b/.test(t)) return 'Balde 1 lt'
    }
    return defaultLabelForBareFamilyName(groupBaseName)
  }

  if (groupBaseName === 'Concreto aparente' && /^concreto\s+aparente\s+natural$/i.test(productName.trim())) {
    return 'Natural'
  }

  const parts = productName.split(/\s-\s/)
  if (parts.length >= 2) {
    const head = normText(parts[0]!.trim())
    const baseNorm = normText(groupBaseName)
    if (head === baseNorm) {
      return parts
        .slice(1)
        .join(' - ')
        .trim()
    }
  }

  if (groupBaseName === 'Plasticop' || groupBaseName === 'Plastibond' || groupBaseName.startsWith('Laca')) {
    if (/\b10\s*(l|lt|lts|litros?)\b/.test(t)) return 'Balde 10 lt'
    if (/\b4\s*(l|lt|lts|litros?)\b/.test(t)) return 'Balde 4 lt'
    if (/\b1\s*(l|lt|lts|litros?)\b/.test(t)) return 'Balde 1 lt'
  }

  if (/\bgris\s+oscuro\b/.test(t)) return 'Gris oscuro'
  if (/\bnatural\b/.test(t)) return 'Natural'
  if (/\bblanc[oa]\b/.test(t)) return 'Blanco'
  if (/\bgris\b/.test(t)) return 'Gris'

  return defaultLabelForBareFamilyName(groupBaseName)
}
