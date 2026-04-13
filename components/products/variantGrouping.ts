/** Agrupa productos por familia (mismo nombre base) para selector de variantes en catálogo y detalle. */

export function stripDiacritics(input: string) {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function normText(input: string) {
  return stripDiacritics(input).toLowerCase()
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
  return null
}

/** Texto del selector: lo que va después de " - " si el prefijo coincide con la familia. */
export function detectVariantLabel(productName: string, groupBaseName: string | null): string {
  if (!groupBaseName) return 'Única'

  const t = normText(productName)
  if (groupBaseName === 'Revoque 3 en 1') {
    return t.includes('proyectable') ? 'Proyectable' : 'Estándar'
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

  return productName.trim()
}
