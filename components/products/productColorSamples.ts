import { normText } from './variantGrouping'

/**
 * Fotos de muestra por color (archivos en /public/Foto-productos).
 * Claves: etiqueta de variante normalizada como en el selector (detectVariantLabel).
 */
const MICROTEX: Record<string, string> = {
  chukum: '/Foto-productos/microtex-color-chukum.jpeg',
  blanco: '/Foto-productos/microtex-color-blanco.jpeg',
  'gris perla': '/Foto-productos/microtex-color-gris-perla.jpeg',
  'gris plata': '/Foto-productos/microtex-color-gris-plata.jpeg',
  'gris oscuro': '/Foto-productos/microtex-color-gris-oscuro.jpeg',
  'gris natural': '/Foto-productos/microtex-color-gris-natural.jpeg',
  'negro': '/Foto-productos/microtex-color-negro.jpeg',
}

const MARMOLTEX: Record<string, string> = {
  blanco: '/Foto-productos/marmoltex-color-blanco.jpeg',
  habano: '/Foto-productos/marmoltex-color-habano.jpeg',
  serrano: '/Foto-productos/marmoltex-color-marrron-cerrano.jpeg',
  arena: '/Foto-productos/marmoltex-color-arena.jpeg',
  'gris eclipse': '/Foto-productos/marmoltex-color-gris-eclipse.jpeg',
  'gris portland': '/Foto-productos/marmoltex-color-gris-portalnd.jpeg',
  'verde alpes': '/Foto-productos/marmoltex-color-verdes-alpes.jpeg',
  'blanco tiza': '/Foto-productos/marmoltex-color-blanco-tiza.jpeg',
}

const CONCRETO_APARENTE: Record<string, string> = {
  'natural': '/Foto-productos/concreto-natural.jpeg',
  'gris oscuro': '/Foto-productos/concreto-gris.jpeg',
}

const VENEZIANO: Record<string, string> = {
  marron: '/Foto-productos/veneziano-color-cafe-cacao.jpeg',
  rojo: '/Foto-productos/veneziano-color-rojo-uxmal.jpeg',
  verde: '/Foto-productos/veneziano-color-verde-agave.jpeg',
  chukum: '/Foto-productos/veneziano-color-chukum.jpeg',
  amarillo: '/Foto-productos/veneziano-color-amarillo-merida.jpeg',
  azul: '/Foto-productos/veneziano-color-azul-tulum.jpeg',
  gris: '/Foto-productos/veneziano-color-gris-taxco.jpeg',
  negro: '/Foto-productos/veneziano-color-negro-onix.jpeg',
}

function normLabel(label: string): string {
  return normText(label).replace(/\s+/g, ' ').trim()
}

/**
 * Devuelve la ruta pública de la foto de muestra del color.
 */
export function getColorSamplePath(groupBaseName: string | null, variantLabel: string): string | null {
  if (!groupBaseName || !variantLabel) return null
  
  const base = normText(groupBaseName)
  const key = normLabel(variantLabel)

  // 1. MICROTEX
  if (base === normText('Microtex')) {
    return MICROTEX[key] ?? null
  }
  
  // 2. MARMOLTEX
  if (base === normText('Marmoltex')) {
    return MARMOLTEX[key] ?? null
  }
  
  // 3. VENEZIANO
  if (base === normText('Veneziano')) {
    return VENEZIANO[key] ?? null
  }

  // 4. CONCRETO APARENTE (Búsqueda flexible por nombre de producto)
  if (base.includes('concreto')) {
    return CONCRETO_APARENTE[key] ?? null
  }

  return null
}
