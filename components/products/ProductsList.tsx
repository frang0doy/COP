'use client'

import { useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import { Search, Filter, X } from 'lucide-react'
import { motion } from 'framer-motion'

export interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  stock: number
  image?: string
  sku: string
}

// Categorías correctas
const categories = [
  'Todas',
  'ADHESIVOS',
  'ESTUCADOS',
  'IMPERMEABILIZANTES',
  'LACA Y BARNICES',
  'REVESTIMIENTO Y REVOQUE',
]

// Datos de ejemplo - en producción vendrán de una API/DB
const mockProducts: Product[] = [
  // ADHESIVOS
  {
    id: 1,
    name: 'Adhesivo Cerámico Premium',
    description: 'Adhesivo de alta adherencia para cerámicos y porcelanatos',
    price: 1250,
    category: 'ADHESIVOS',
    stock: 50,
    sku: 'ADH-001',
  },
  {
    id: 2,
    name: 'Adhesivo Flex',
    description: 'Adhesivo flexible para exteriores y zonas de tráfico',
    price: 1450,
    category: 'ADHESIVOS',
    stock: 35,
    sku: 'ADH-002',
  },
  {
    id: 3,
    name: 'Adhesivo Rápido',
    description: 'Adhesivo de fraguado rápido para trabajos urgentes',
    price: 1680,
    category: 'ADHESIVOS',
    stock: 28,
    sku: 'ADH-003',
  },
  // ESTUCADOS
  {
    id: 4,
    name: 'Estucado Acrílico',
    description: 'Estucado acrílico decorativo para interiores',
    price: 1890,
    category: 'ESTUCADOS',
    stock: 40,
    sku: 'EST-001',
  },
  {
    id: 5,
    name: 'Estucado Texturado',
    description: 'Estucado texturado para fachadas exteriores',
    price: 2150,
    category: 'ESTUCADOS',
    stock: 30,
    sku: 'EST-002',
  },
  {
    id: 6,
    name: 'Estucado Liso',
    description: 'Estucado liso de acabado perfecto',
    price: 1750,
    category: 'ESTUCADOS',
    stock: 45,
    sku: 'EST-003',
  },
  // IMPERMEABILIZANTES
  {
    id: 7,
    name: 'Impermeabilizante Elastómero',
    description: 'Impermeabilizante de alta resistencia para terrazas y azoteas',
    price: 3200,
    category: 'IMPERMEABILIZANTES',
    stock: 25,
    sku: 'IMP-001',
  },
  {
    id: 8,
    name: 'Impermeabilizante Acrílico',
    description: 'Impermeabilizante acrílico para muros y fachadas',
    price: 2850,
    category: 'IMPERMEABILIZANTES',
    stock: 32,
    sku: 'IMP-002',
  },
  {
    id: 9,
    name: 'Impermeabilizante Transparente',
    description: 'Impermeabilizante transparente que no altera el color',
    price: 2950,
    category: 'IMPERMEABILIZANTES',
    stock: 20,
    sku: 'IMP-003',
  },
  // LACA Y BARNICES
  {
    id: 10,
    name: 'Laca Poliuretánica',
    description: 'Laca de alta resistencia para muebles y superficies de madera',
    price: 2450,
    category: 'LACA Y BARNICES',
    stock: 38,
    sku: 'LAC-001',
  },
  {
    id: 11,
    name: 'Barniz Protector',
    description: 'Barniz protector UV para exteriores',
    price: 2200,
    category: 'LACA Y BARNICES',
    stock: 42,
    sku: 'LAC-002',
  },
  {
    id: 12,
    name: 'Laca Acrílica',
    description: 'Laca acrílica de secado rápido',
    price: 1980,
    category: 'LACA Y BARNICES',
    stock: 50,
    sku: 'LAC-003',
  },
  // REVESTIMIENTO Y REVOQUE
  {
    id: 13,
    name: 'Revestimiento Texturado',
    description: 'Revestimiento texturado para fachadas con excelente adherencia',
    price: 1890,
    category: 'REVESTIMIENTO Y REVOQUE',
    stock: 30,
    sku: 'REV-001',
  },
  {
    id: 14,
    name: 'Revestimiento Acrílico',
    description: 'Revestimiento acrílico decorativo para interiores',
    price: 1650,
    category: 'REVESTIMIENTO Y REVOQUE',
    stock: 40,
    sku: 'REV-002',
  },
  {
    id: 15,
    name: 'Revoque Plástico',
    description: 'Revoque plástico de alta calidad para exteriores',
    price: 1750,
    category: 'REVESTIMIENTO Y REVOQUE',
    stock: 35,
    sku: 'REV-003',
  },
  {
    id: 16,
    name: 'Revestimiento Elastómero',
    description: 'Revestimiento elástico para zonas con movimiento',
    price: 2100,
    category: 'REVESTIMIENTO Y REVOQUE',
    stock: 28,
    sku: 'REV-004',
  },
]

export default function ProductsList() {
  const [products] = useState<Product[]>(mockProducts)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')

  useEffect(() => {
    let filtered = products

    // Filtrar por categoría
    if (selectedCategory !== 'Todas') {
      filtered = filtered.filter((p) => p.category === selectedCategory)
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }, [searchTerm, selectedCategory, products])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('Todas')
  }

  return (
    <div>
      {/* Filtros y Búsqueda */}
      <div className="mb-12 space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          {/* Búsqueda */}
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 focus:border-black transition-colors bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filtro por categoría */}
          <div className="relative w-full lg:w-auto">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full lg:w-64 pl-12 pr-10 py-3 border-2 border-gray-200 focus:border-black transition-colors appearance-none bg-white cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros activos */}
        {(searchTerm || selectedCategory !== 'Todas') && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-600">Filtros activos:</span>
            {selectedCategory !== 'Todas' && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm">
                {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('Todas')}
                  className="hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm">
                "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-black underline"
            >
              Limpiar todos
            </button>
          </div>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="mb-8 pb-4 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Mostrando <span className="font-semibold text-black">{filteredProducts.length}</span> de{' '}
          <span className="font-semibold text-black">{products.length}</span> productos
          {selectedCategory !== 'Todas' && ` en ${selectedCategory}`}
        </p>
      </div>

      {/* Lista de productos */}
      {filteredProducts.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          layout
        >
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.03,
                ease: [0.22, 1, 0.36, 1]
              }}
              layout
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">No se encontraron productos</p>
          <button
            onClick={clearFilters}
            className="text-black hover:text-gray-600 underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}
