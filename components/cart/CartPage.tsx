'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/context/CartContext'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, itemsCount } = useCart()
  const { data: session } = useSession()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center py-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-6">Agrega productos para comenzar tu compra</p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/productos"
              className="inline-block bg-black text-white px-6 py-3 border-2 border-black hover:bg-gray-900 transition"
            >
              Explorar Productos
            </Link>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.h1 
        className="text-3xl font-bold text-gray-900 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Carrito de Compras
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Lista de productos */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: [0.22, 1, 0.36, 1]
                }}
                layout
                className="bg-white rounded-lg shadow-md p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200"
              >
                {/* Imagen */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-400 text-xs">Imagen</span>
                </div>

                {/* Información */}
                <div className="flex-1 w-full sm:w-auto">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-black font-bold text-lg sm:text-xl">
                    ${item.price.toLocaleString('es-MX')}
                  </p>
                </div>

                {/* Controles de cantidad */}
                <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
                  <motion.button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-700" />
                  </motion.button>
                  <span className="w-12 text-center font-semibold">{item.quantity}</span>
                  <motion.button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-700" />
                  </motion.button>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${(item.price * item.quantity).toLocaleString('es-MX')}
                  </p>
                  <motion.button
                    onClick={() => removeItem(item.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-2 text-red-600 hover:text-red-700 flex items-center space-x-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Eliminar</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Resumen del pedido */}
        <motion.div 
          className="lg:col-span-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen del Pedido</h2>

            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="text-gray-900 font-semibold">
                    ${(item.price * item.quantity).toLocaleString('es-MX')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold text-gray-900 mb-2">
                <span>Total</span>
                <span>${total.toLocaleString('es-MX')}</span>
              </div>
              <p className="text-sm text-gray-500">El envío se calculará después</p>
            </div>

            {session ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/checkout"
                  className="block w-full bg-black text-white text-center py-3 border-2 border-black font-semibold hover:bg-gray-900 transition-colors"
                >
                  Proceder al Pago
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center mb-3">
                  Inicia sesión para continuar
                </p>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/auth/login?callbackUrl=/checkout"
                    className="block w-full bg-black text-white text-center py-3 border-2 border-black font-semibold hover:bg-gray-900 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                </motion.div>
              </div>
            )}

            <Link
              href="/productos"
              className="block w-full text-center text-black hover:text-gray-600 transition-colors mt-4"
            >
              Continuar Comprando
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
