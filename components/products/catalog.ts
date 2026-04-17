export type CategoryKey =
  | 'adhesivos'
  | 'combos'
  | 'estucados'
  | 'revestimientos'
  | 'revoques'
  | 'impermeabilizables'
  | 'laca_y_barnices'
  | 'selladores_y_pinturas'

export const CATEGORY_ORDER: CategoryKey[] = [
  'adhesivos',
  'combos',
  'estucados',
  'revestimientos',
  'revoques',
  'impermeabilizables',
  'laca_y_barnices',
  'selladores_y_pinturas',
]

export const CATEGORY_LABEL: Record<CategoryKey, string> = {
  estucados: 'Estucados',
  revestimientos: 'Revestimientos',
  revoques: 'Revoques',
  impermeabilizables: 'Impermeabilizables',
  adhesivos: 'Adhesivos',
  combos: 'Combos',
  laca_y_barnices: 'Laca y barnices',
  selladores_y_pinturas: 'Selladores y pinturas',
}

export type CategoryTheme = {
  /** Color principal del acento (Tailwind classes). */
  accent: string
  /** Color de texto recomendado para labels (Tailwind classes). */
  text: string
  /** Color de fondo recomendado para chips (Tailwind classes). */
  chipBg: string
  /** Borde/ring recomendado para chips (Tailwind classes). */
  chipRing: string
}

export const CATEGORY_THEME: Record<CategoryKey, CategoryTheme> = {
  // Estucados: negro
  estucados: {
    accent: 'bg-black',
    text: 'text-black',
    chipBg: 'bg-black',
    chipRing: 'ring-black/15',
  },
  // Revestimientos: verde oscuro
  revestimientos: {
    accent: 'bg-emerald-900',
    text: 'text-emerald-900',
    chipBg: 'bg-emerald-900',
    chipRing: 'ring-emerald-900/15',
  },
  // Revoques: azul
  revoques: {
    accent: 'bg-blue-600',
    text: 'text-blue-700',
    chipBg: 'bg-blue-600',
    chipRing: 'ring-blue-600/15',
  },
  // Impermeabilizables: rojo
  impermeabilizables: {
    accent: 'bg-red-600',
    text: 'text-red-700',
    chipBg: 'bg-red-600',
    chipRing: 'ring-red-600/15',
  },
  // Adhesivos: violeta
  adhesivos: {
    accent: 'bg-violet-600',
    text: 'text-violet-700',
    chipBg: 'bg-violet-600',
    chipRing: 'ring-violet-600/15',
  },
  // Combos: naranja
  combos: {
    accent: 'bg-orange-500',
    text: 'text-orange-700',
    chipBg: 'bg-orange-500',
    chipRing: 'ring-orange-500/15',
  },
  // Laca y barnices: blanco
  laca_y_barnices: {
    accent: 'bg-white',
    text: 'text-black',
    chipBg: 'bg-white',
    chipRing: 'ring-black/15',
  },
  // Selladores y pinturas: blanco
  selladores_y_pinturas: {
    accent: 'bg-white',
    text: 'text-black',
    chipBg: 'bg-white',
    chipRing: 'ring-black/15',
  },
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  category: CategoryKey
  stock: number
  image?: string
  sku: string
  technicalSheet?: string
  technicalSummary?: TechnicalSummary
  isNew?: boolean
}

export type TechnicalSummary = {
  rendimiento?: string
  almacenaje?: string
  presentacion?: string
  conservacion?: string
  colores?: string
  usos?: string
  observaciones?: string
}

/** Excepciones puntuales (nombre de ficha ≠ derivado de imagen). Vacío si los PDF siguen el mismo criterio que las fotos. */
const TECH_SHEET_OVERRIDES_BY_ID: Record<number, string> = {}

/** Sin ficha en repo (no hay PDF para este producto). */
const TECH_SHEET_MISSING_BY_ID = new Set<number>([
  6, // PEGACOP Acrílico (aún no hay PDF)
])



function stripDiacritics(input: string) {
  // NFD separa letras y diacríticos; luego removemos los diacríticos.
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeToSheetBase(input: string) {
  const noDiacritics = stripDiacritics(input)
  return (
    noDiacritics
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, '') // extensión si existe
      .replace(/^[\\/]/, '')
      .replace(/[^a-z0-9]+/g, '_') // espacios y símbolos -> "_"
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_')
      // Ignorar sufijos típicos de imágenes "actualizadas"
      .replace(/_(nuevo|nueva)$/g, '')
      // versiones/sufijos típicos en nombres de imágenes: "...4", "...1", etc.
      .replace(/_\d+$/g, '')
  )
}

function computeTechnicalSheet(product: Product): string | undefined {
  if (TECH_SHEET_MISSING_BY_ID.has(product.id)) {
    return undefined
  }

  const overrideFile = TECH_SHEET_OVERRIDES_BY_ID[product.id]
  if (overrideFile) {
    return `/documents/fichas-tecnicas/${overrideFile}`
  }

  // Preferimos derivar desde la imagen (suele coincidir con el archivo de ficha).
  const imageBase = product.image ? product.image.split('/').pop() ?? '' : ''
  const candidatesBase = [
    imageBase ? normalizeToSheetBase(imageBase) : '',
    normalizeToSheetBase(product.name),
  ].filter(Boolean)

  for (const base of candidatesBase) {
    return `/documents/fichas-tecnicas/${base}.pdf`
  }

  return undefined
}

const TECHNICAL_SUMMARY_BY_ID: Record<number, TechnicalSummary> = {
  // Adhesivos
  1: {
    rendimiento: '4 m² por bolsa de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Gris.',
    usos: 'Colocación de piezas cerámicas de alta absorción sobre carpetas o revoques interiores.',
  },
  2: {
    rendimiento: '4 m² por bolsa de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Gris.',
    usos: 'Colocación de porcelanatos en pisos y paredes interiores o exteriores.',
  },
  3: {
    rendimiento: '4 m² por bolsa de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Gris.',
    usos: 'Colocación de grandes formatos y/o sobre pisos existentes sin retirar el revestimiento anterior.',
  },
  4: {
    rendimiento: '15 m² por bolsa de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Gris.',
    usos: 'Elevación de mampostería (ladrillo cerámico/block/arcilla) en muros interiores/exteriores no estructurales.',
  },
  5: {
    rendimiento: '80 m² por bolsa de 15 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 15 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Blanco, gris natural y gris oscuro.',
    usos: 'Relleno de juntas entre piezas cerámicas, pisos y azulejos.',
  },
  6: {
    rendimiento: '15 m² por balde de 25 lt.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 25 lt.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Blanco marfil.',
    usos: 'Adhesivo acrílico listo para usar; recomendado para trabajos de colocación en interiores/exteriores no estructurales.',
    observaciones: 'Nuevo producto.',
  },
  7: {
    rendimiento: '15 m² por balde de 25 lt.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 25 lt.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Gris.',
    usos: 'Adhesivo listo para usar; elevación de mampostería en muros interiores/exteriores no estructurales.',
    observaciones: 'Nuevo producto.',
  },

  // Estucados
  9: {
    rendimiento: '15 m² por balde de 15 lt (a 2 mm de espesor).',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 15 lt.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores:
      'Gris natural/plata/perla/oscuro, marrón, chukum, blanco y negro.',
    usos:
      'Aplicación sobre revoque fino, placas de cartón yeso, base coat y fibrocemento; recomendado sellar previamente según soporte.',
  },
  10: {
    rendimiento: '20 m² por bolsa de 25 kg (a 2 mm de espesor).',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Gris natural, gris oscuro, blanco.',
    usos:
      'Aplicación sobre revoque fino, placas de cartón yeso, base coat y fibrocemento; recomendado sellar previamente según soporte.',
  },
  11: {
    rendimiento: '15 m² por balde de 5 lt (a tres manos).',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 5 lt.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores:
      'Marrón, azul, rojo, gris, amarillo, verde, negro, chukum y blanco mármol.',
    usos:
      'Aplicación sobre Concreto Aparente Blanco o sobre Redimix, con sellado previo.',
  },
  12: {
    rendimiento: '12 m² por bolsa de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Gris, blanco y gris oscuro.',
    usos:
      'Uso en paredes/pisos/piscinas/duchas; para piscinas, aplicar sobre revoque grueso con sellado previo.',
  },
  13: {
    rendimiento: '10 m² por bolsa de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Arena.',
    usos:
      'Aplicación sobre revoque fino, revoque grueso alisado y base coat con sellado previo.',
    observaciones: 'Nuevo producto.',
  },
  14: {
    rendimiento: '15 m² por bolsa de 25 kg (a 2 mm de espesor).',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Gris natural y gris oscuro.',
    usos:
      'Aplicación sobre revoque fino, placas de cartón yeso, base coat, fibrocemento y yeso con sellado previo.',
    observaciones: 'Nuevo producto.',
  },

  // Selladores y pinturas / masillas
  15: {
    rendimiento: '30 m² por balde de 10 lt.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 10 lt.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores: 'Azul.',
    usos: 'Fijador mordiente para la preparación de superficies lisas.',
  },
  33: {
    rendimiento: '50 m² por balde de 10 lt.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 10 lt.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores: 'Transparente.',
    usos:
      'Sellador al agua para preparación de superficies previo a morteros y revestimientos.',
  },
  37: {
    rendimiento: '50 m² por balde de 10 lt.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 10 lt.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores:
      'Arena, gris eclipse, gris portland, habano, serrano, verde alpes, blanco.',
    usos:
      'Pintura látex al agua con color incorporado para preparación de superficies.',
  },
  38: {
    rendimiento: '50 m² por balde de 20 lt.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 20 lt.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores:
      'Arena, chocolate, gris eclipse, gris portland, habano, serrano, verde alpes, blanco.',
    usos:
      'Pintura látex al agua con color incorporado para paredes, revoques y mampostería (con sellado previo).',
  },
  39: {
    rendimiento: '50 m² por balde de 20 lt.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 20 lt.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores:
      'Arena, gris eclipse, gris portland, habano, serrano, verde alpes, blanco.',
    usos:
      'Pintura látex de alto poder cubritivo para paredes, revoques y mampostería (con sellado previo).',
    observaciones: 'Nuevo producto.',
  },
  40: {
    rendimiento: '50 m² por balde de 30 lt.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 30 lt.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores: 'Blanco.',
    usos:
      'Pasta base acrílica para juntas en construcción en seco y corrección de imperfecciones (con sellado previo).',
  },
  41: {
    rendimiento: '15 m² por bolsa de 15 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 15 kg.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores: 'Blanco o gris.',
    usos:
      'Mortero para alisar y nivelar superficies, preparando la base para pintura (con sellado previo).',
    observaciones: 'Nuevo producto.',
  },

  // Revestimientos
  16: {
    rendimiento: '8–15 m² por balde de 25 lt (según método).',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 25 lt.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores:
      'Arena, gris eclipse, gris portland, habano, serrano, verde alpes, blanco.',
    usos:
      'Aplicación sobre revoque fino/grueso alisado, placas de cartón yeso, base coat y fibrocemento (con sellado previo).',
  },
  17: {
    rendimiento: '8–15 m² por balde de 25 lt (según método).',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 25 lt.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores: 'Blanco marfil.',
    usos:
      'Aplicación sobre revoque fino/grueso alisado, placas de cartón yeso, base coat y fibrocemento (con sellado previo).',
  },
  18: {
    rendimiento: '10 m² por bolsa de 30 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 30 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Blanco tiza y arena.',
    usos:
      'Aplicación sobre revoque fino, revoque grueso alisado y base coat (con sellado previo).',
  },
  19: {
    rendimiento: '7 m² por balde de 25 lt (según método).',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 25 lt.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores: 'Negro, dálmata y verona.',
    usos: 'Aplicación sobre revoque fino (con sellado previo).',
    observaciones: 'Nuevo producto.',
  },
  20: {
    rendimiento: '10 m² por bolsa de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores: 'Blanco.',
    usos:
      'Aplicación en pisos con exposición directa al sol donde se requiera baja transmitancia térmica y alta reflectancia.',
    observaciones: 'Nuevo producto.',
  },

  // Revoques
  21: {
    rendimiento: '10 m² por balde de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Blanco.',
    usos:
      'Nivelación de carpetas y muebles previo a Microtex o Cuarzotex (con sellado previo).',
    observaciones: 'Nuevo producto.',
  },
  22: {
    rendimiento: '8 m² por bolsa de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Blanco.',
    usos:
      'Aplicación sobre revoque fino, revoque grueso alisado y base coat (con sellado previo).',
  },
  23: {
    rendimiento: '10 m² por bolsa de 30 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 30 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Gris.',
    usos:
      'Aplicación sobre block/ladrillo hueco y revoques gruesos (con sellado previo).',
  },
  24: {
    rendimiento: '8 m² por bolsa de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Gris.',
    usos:
      'Aplicación sobre poliestireno, placas de yeso, hormigón celular y revoque grueso (con sellado previo).',
  },
  25: {
    rendimiento: '8 m² por bolsa de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Gris.',
    usos:
      'Nivelación sobre carpetas cementicias, placas de yeso, pisos, concreto o cerámicos/azulejos existentes (con sellado previo).',
  },
  26: {
    rendimiento: '3 m² a 1 cm de espesor por bolsa de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Blanco.',
    usos:
      'Aplicación en muros interiores de block, ladrillo u hormigón (con sellado previo).',
  },
  27: {
    rendimiento: '20 m² por bolsa de 25 kg (a 3 mm de espesor).',
    almacenaje: 'Almacenar en su envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Gris natural.',
    usos:
      'Interior y exterior sobre hormigones y morteros; terminación símil hormigón o reparación.',
    observaciones: 'Nuevo producto.',
  },

  // Impermeabilizables
  28: {
    rendimiento: '10 m² por bolsa de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Gris.',
    usos:
      'Impermeabilización en techos, balcones, baños, piscinas, cisternas y tanques de agua.',
  },
  29: {
    rendimiento: '10 m² por bolsa de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Gris.',
    usos:
      'Tratamiento anti salitre para prevenir o reparar eflorescencias y humedades ascendentes por capilaridad.',
  },
  30: {
    rendimiento: '30 m² con rodillo / 12 m² con llana por bolsa de 25 kg.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Bolsa de 25 kg.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores: 'Gris.',
    usos:
      'Cisternas, techos, terrazas, baños y juntas de placas para evitar fisuras.',
  },
  31: {
    rendimiento: '20 m² por balde de 20 lt.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 20 lt.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores: 'Blanco y rojo.',
    usos:
      'Impermeabilización acrílica para techos, tinglados y terrazas; paredes exteriores con protección extra.',
  },
  32: {
    rendimiento: '20 m² por balde de 20 lt.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 20 lt.',
    conservacion: '12 meses desde la fecha de fabricación.',
    colores: 'Blanco y rojo.',
    usos:
      'Impermeabilización poliuretánica para techos y terrazas; paredes exteriores con protección extra.',
  },

  // Laca y barnices
  34: {
    rendimiento: '16 m² por balde de 4 lt.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 4 lt y de 1 lt.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Transparente.',
    usos:
      'Barniz poliuretánico mate para revestimientos cementicios/acrílicos y madera, con alta resistencia a abrasión y manchado.',
  },
  35: {
    rendimiento: '16 m² por balde de 4 lt.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 4 lt y de 1 lt.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Transparente.',
    usos:
      'Barniz poliuretánico brilloso para revestimientos cementicios/acrílicos y madera, con alta resistencia a abrasión y manchado.',
  },
  36: {
    rendimiento: '20 m² por balde de 4 lt.',
    almacenaje: 'Envase original herméticamente cerrado.',
    presentacion: 'Balde de 4 lt.',
    conservacion: '6 meses desde la fecha de fabricación.',
    colores: 'Transparente.',
    usos:
      'Silicón hidrófugo incoloro para protección de revestimientos acrílicos/cementicios (microcemento, estucados, ladrillos vistos, tejas).',
  },
}

// Nota: en esta etapa (solo diseño) los productos están mockeados. Luego vendrán de API/DB.
const RAW_PRODUCTS: Product[] = [
  // Adhesivos (1-8)
  {
    id: 1,
    name: 'Pega Cerámico',
    description: 'Adhesivo para colocación de cerámicos.',
    price: 1250,
    category: 'adhesivos',
    stock: 50,
    sku: 'ADH-001',
    image: '/Foto-productos/pega_ceramico_nuevo.png',
  },
  {
    id: 2,
    name: 'Pega Porcelanato',
    description: 'Adhesivo para porcelanatos y piezas de baja absorción.',
    price: 1450,
    category: 'adhesivos',
    stock: 35,
    sku: 'ADH-002',
    image: '/Foto-productos/pega_porcelanato_nuevo.png',
  },
  {
    id: 3,
    name: 'Piso sobre piso FLEX',
    description: 'Adhesivo flexible para piso sobre piso.',
    price: 1680,
    category: 'adhesivos',
    stock: 28,
    sku: 'ADH-003',
    image: '/Foto-productos/pisosobrepiso_flex_nuevo.png',
  },
  {
    id: 4,
    name: 'Pega Block',
    description: 'Adhesivo para bloques y mampostería.',
    price: 1850,
    category: 'adhesivos',
    stock: 22,
    sku: 'ADH-004',
    image: '/Foto-productos/pega_block_nuevo.png',
  },
  {
    id: 5,
    name: 'Pastina Impermeable',
    description: 'Pastina impermeable para relleno de juntas.',
    price: 2100,
    category: 'adhesivos',
    stock: 18,
    sku: 'ADH-005',
    image: '/Foto-productos/pastina_impermeable_nuevo.png',
  },
  {
    id: 6,
    name: 'PEGACOP Acrílico',
    description: 'Adhesivo acrílico listo para usar.',
    price: 2300,
    category: 'adhesivos',
    stock: 16,
    sku: 'ADH-006',
    isNew: true,
  },
  {
    id: 7,
    name: 'PEGA Cop',
    description: 'Adhesivo para colocación de revestimientos.',
    price: 980,
    category: 'adhesivos',
    stock: 60,
    sku: 'ADH-007',
    isNew: true,
    image: '/Foto-productos/pega_cop_nuevo.png',
  },

  // Estucados (9-15)
  {
    id: 9,
    name: 'Microtex',
    description: 'Estucado decorativo para interiores.',
    price: 1890,
    category: 'estucados',
    stock: 40,
    sku: 'EST-001',
    image: '/Foto-productos/microtex_nuevo.png',
  },
  {
    id: 10,
    name: 'Concreto aparente',
    description: 'Terminación tipo concreto aparente.',
    price: 2150,
    category: 'estucados',
    stock: 30,
    sku: 'EST-002',
    image: '/Foto-productos/concreto_aparente_nuevo.png',
  },
  {
    id: 11,
    name: 'Veneziano',
    description: 'Terminación tipo veneciano.',
    price: 1750,
    category: 'estucados',
    stock: 45,
    sku: 'EST-003',
    image: '/Foto-productos/veneziano_nuevo.png',
  },
  {
    id: 12,
    name: 'Micro piscinas',
    description: 'Revestimiento para piscinas.',
    price: 1950,
    category: 'estucados',
    stock: 27,
    sku: 'EST-004',
    image: '/Foto-productos/micro_piscinas_nuevo.png',
  },
  {
    id: 13,
    name: 'Pasta Chukum',
    description: 'Terminación tipo chukum.',
    price: 2050,
    category: 'estucados',
    stock: 24,
    sku: 'EST-005',
    isNew: true,
    image: '/Foto-productos/pasta_chukum_nuevo.png',
  },
  {
    id: 14,
    name: 'CUARZOTEX',
    description: 'Revestimiento de alta resistencia.',
    price: 2250,
    category: 'estucados',
    stock: 21,
    sku: 'EST-006',
    isNew: true,
    image: '/Foto-productos/cuarzotex_nuevo.png',
  },
  {
    id: 15,
    // Selladores y pinturas
    name: 'Plasticop',
    description: 'Sellador / pintura (línea Plasticop).',
    price: 1850,
    category: 'selladores_y_pinturas',
    stock: 33,
    sku: 'SEL-000',
    image: '/Foto-productos/plasticop_nuevo.png',
  },

  // Revestimientos (16-21)
  {
    id: 16,
    name: 'Marmoltex',
    description: 'Revestimiento decorativo.',
    price: 1890,
    category: 'revestimientos',
    stock: 30,
    sku: 'REV-001',
    image: '/Foto-productos/marmolatex_nuevo.png',
  },
  {
    id: 17,
    name: 'TEXTUCOP acrílico',
    description: 'Revestimiento acrílico texturado.',
    price: 1650,
    category: 'revestimientos',
    stock: 40,
    sku: 'REV-002',
    image: '/Foto-productos/textucop_acrilico_nuevo.png',
  },
  {
    id: 18,
    name: 'TEXTUCOP',
    description: 'Revestimiento texturado.',
    price: 2100,
    category: 'revestimientos',
    stock: 28,
    sku: 'REV-003',
    image: '/Foto-productos/textucopL_nuevo.png',
  },
  {
    id: 19,
    name: 'Stone COP',
    description: 'Revestimiento tipo piedra.',
    price: 1720,
    category: 'revestimientos',
    stock: 36,
    sku: 'REV-004',
    isNew: true,
    image: '/Foto-productos/stone_cop_nuevo.png',
  },
  {
    id: 20,
    name: 'Micro atermico',
    description: 'Revestimiento atermico.',
    price: 1980,
    category: 'revestimientos',
    stock: 19,
    sku: 'REV-005',
    isNew: true,
    image: '/Foto-productos/micro_atermico_nuevo.png',
  },
  {
    id: 21,
    // Se reasigna para completar revoques (7 productos) sin inventar IDs nuevos.
    name: 'Pasta Niveladora',
    description: 'Pasta niveladora.',
    price: 2350,
    category: 'revoques',
    stock: 14,
    sku: 'REV-006',
    isNew: true,
    image: '/Foto-productos/pasta_niveladora_nuevo.png',
  },

  // Revoques (22-27)
  {
    id: 22,
    name: 'Revoque 4 en 1',
    description: 'Revoque multifunción.',
    price: 1750,
    category: 'revoques',
    stock: 35,
    sku: 'REQ-001',
    image: '/Foto-productos/revoque_4en1_nuevo.png',
  },
  {
    id: 23,
    name: 'Revoque 3 en 1',
    description: 'Revoque multifunción.',
    price: 1480,
    category: 'revoques',
    stock: 46,
    sku: 'REQ-002',
    image: '/Foto-productos/revoque_3en1_nuevo.png',
  },
  {
    id: 24,
    name: 'Base Cop',
    description: 'Base para revoques.',
    price: 1320,
    category: 'revoques',
    stock: 52,
    sku: 'REQ-003',
    image: '/Foto-productos/base_cop_nuevo.png',
  },
  {
    id: 25,
    name: 'Base Niveladora',
    description: 'Base niveladora.',
    price: 1650,
    category: 'revoques',
    stock: 23,
    sku: 'REQ-004',
    image: '/Foto-productos/base_niveladora_nuevo.png',
  },
  {
    id: 26,
    name: 'Yeso Cop',
    description: 'Yeso para interiores.',
    price: 1200,
    category: 'revoques',
    stock: 58,
    sku: 'REQ-005',
    image: '/Foto-productos/yeso_cop_nuevo.png',
  },
  {
    id: 27,
    name: 'Hormicop',
    description: 'Mortero / revoque de alta resistencia.',
    price: 1550,
    category: 'revoques',
    stock: 31,
    sku: 'REQ-006',
    isNew: true,
    image: '/Foto-productos/hormicop_nuevo.png',
  },

  // Impermeabilizables (28-33)
  {
    id: 28,
    name: 'Impercop',
    description: 'Impermeabilizante.',
    price: 3200,
    category: 'impermeabilizables',
    stock: 25,
    sku: 'IMP-001',
    image: '/Foto-productos/impercop_nuevo.png',
  },
  {
    id: 29,
    name: 'Anti Salitre',
    description: 'Tratamiento anti salitre.',
    price: 2850,
    category: 'impermeabilizables',
    stock: 32,
    sku: 'IMP-002',
    image: '/Foto-productos/anti_salitre_nuevo.png',
  },
  {
    id: 30,
    name: 'Monoelastic',
    description: 'Impermeabilizante cementicio elástico.',
    price: 2950,
    category: 'impermeabilizables',
    stock: 20,
    sku: 'IMP-003',
    image: '/Foto-productos/monoelastic_nuevo.png',
  },
  {
    id: 31,
    name: 'Membrana Líquida',
    description: 'Membrana líquida.',
    price: 3450,
    category: 'impermeabilizables',
    stock: 17,
    sku: 'IMP-004',
    image: '/Foto-productos/memb_liquida_nueva.png',
  },
  {
    id: 32,
    name: 'Membrana Poliuretánica',
    description: 'Membrana poliuretánica.',
    price: 3100,
    category: 'impermeabilizables',
    stock: 15,
    sku: 'IMP-005',
    image: '/Foto-productos/membrana_poliuretanica_nueva.png',
  },
  {
    id: 33,
    // Selladores y pinturas
    name: 'Plastibond',
    description: 'Sellador / pintura (línea Plastibond).',
    price: 1750,
    category: 'selladores_y_pinturas',
    stock: 29,
    sku: 'SEL-003',
    image: '/Foto-productos/plastiband_nuevo.png',
  },

  // Laca y barnices (34-37)
  {
    id: 34,
    name: 'Laca Poliuretanica MATE',
    description: 'Laca poliuretánica mate.',
    price: 2450,
    category: 'laca_y_barnices',
    stock: 38,
    sku: 'LAC-001',
    image: '/Foto-productos/laca_poli_mate_balde4_nuevo.png',
  },
  {
    id: 35,
    name: 'Laca Poliuretanica Brillosa',
    description: 'Laca poliuretánica brillosa.',
    price: 2200,
    category: 'laca_y_barnices',
    stock: 42,
    sku: 'LAC-002',
    image: '/Foto-productos/laca_poli_brillo_balde4_nuevo.png',
  },
  {
    id: 36,
    name: 'Cop Silicòn',
    description: 'Producto línea silicón.',
    price: 1980,
    category: 'laca_y_barnices',
    stock: 50,
    sku: 'LAC-003',
    image: '/Foto-productos/cop_silicon4_nuevo.png',
  },
  {
    id: 37,
    // Selladores y pinturas
    name: 'Fondo Cop',
    description: 'Fondo / imprimación.',
    price: 2050,
    category: 'selladores_y_pinturas',
    stock: 27,
    sku: 'SEL-004',
    image: '/Foto-productos/fondo_cop_nuevo.png',
  },

  // Selladores y pinturas (38-41)
  {
    id: 38,
    name: 'Pintucop',
    description: 'Pintura / sellador (línea Pintucop).',
    price: 1600,
    category: 'selladores_y_pinturas',
    stock: 44,
    sku: 'SEL-001',
    image: '/Foto-productos/pintucop_nuevo.png',
  },
  {
    id: 39,
    name: 'Mastercril',
    description: 'Pintura / sellador (línea Mastercril).',
    price: 1450,
    category: 'selladores_y_pinturas',
    stock: 41,
    sku: 'SEL-002',
    isNew: true,
    image: '/Foto-productos/mastercril_nuevo.png',
  },
  {
    id: 40,
    name: 'Redimix',
    description: 'Pintura / sellador (línea Redimix).',
    price: 2350,
    category: 'selladores_y_pinturas',
    stock: 34,
    sku: 'SEL-005',
    image: '/Foto-productos/redimix_nuevo.png',
  },
  {
    id: 41,
    name: 'Skin Coat',
    description: 'Pintura / sellador (línea Skin Coat).',
    price: 2650,
    category: 'selladores_y_pinturas',
    stock: 25,
    sku: 'SEL-006',
    isNew: true,
    image: '/Foto-productos/skim_coat_nuevo.png',
  },
  // Combos
  {
    id: 42,
    name: 'Combo · Sistema de Microtex para 12m²',
    description:
      'Incluye:\n' +
      '- Plasticop (4 litros)\n' +
      '- Base niveladora (2 bolsas de 25 kg)\n' +
      '- Malla de fibra de vidrio (2 metros)\n' +
      '- Microtex (15 kilos)\n' +
      '- Laca poliuretánica (4 litros)\n\n' +
      'Ideal para quienes quieren el sistema completo para aplicar Microtex en aproximadamente 12m².',
    price: 0,
    category: 'combos',
    stock: 999,
    sku: 'COM-001',
    isNew: true,
    image: '/Foto-productos/combo1.png',
    // Usamos el catálogo PDF como “ficha” por defecto (podemos reemplazarlo por una ficha propia cuando la tengas).
    technicalSheet: '/documents/fichas-tecnicas/catalogoCOP.pdf',
  },
]

export const PRODUCTS: Product[] = RAW_PRODUCTS.map((p) => ({
  ...p,
  technicalSheet: (p as any).technicalSheet ?? computeTechnicalSheet(p),
  technicalSummary: TECHNICAL_SUMMARY_BY_ID[p.id],
}))

export function getTechnicalSummaryById(id: number): TechnicalSummary | undefined {
  return TECHNICAL_SUMMARY_BY_ID[id]
}

/** Ficha técnica según el catálogo en código (PDF); la DB puede quedar desactualizada tras cambios de fichas. */
export function getTechnicalSheetById(id: number): string | undefined {
  return PRODUCTS.find((p) => p.id === id)?.technicalSheet
}


