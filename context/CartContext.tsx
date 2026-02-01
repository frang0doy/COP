'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import toast from 'react-hot-toast'
import { ShoppingCart, Trash2 } from 'lucide-react'
import Link from 'next/link'

// Sin límite fijo por producto: se limita por stock disponible.

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image?: string
  stock: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: (options?: { silent?: boolean }) => void
  itemsCount: number
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const showCartToast = (params: {
    intent: 'success' | 'danger'
    title: string
    description?: string
    toastId?: string
  }) => {
    const { intent, title, description, toastId } = params

    // Usamos colores inline para que SIEMPRE se vean (sin depender de compilación/purge de clases)
    const stripeColor = intent === 'success' ? '#22c55e' : '#ef4444' // emerald-500 / red-500
    const iconBgColor = intent === 'success' ? '#ecfdf5' : '#fef2f2' // emerald-50 / red-50
    const iconBorderColor = intent === 'success' ? '#d1fae5' : '#fee2e2' // emerald-100 / red-100
    const iconColor = intent === 'success' ? '#16a34a' : '#dc2626' // emerald-600-ish / red-600

    toast.custom(
      (t) => (
        <div className="pointer-events-auto w-[min(92vw,420px)] overflow-hidden border border-gray-200 bg-white text-black shadow-2xl relative">
          {/* Línea inferior (obligatoria, recta y de borde a borde) */}
          <div
            className="absolute left-0 right-0 bottom-0 h-2"
            style={{ backgroundColor: stripeColor }}
          />

          <div className="px-4 py-3 pb-5 flex items-start gap-3">
            <div
              className="mt-0.5 w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: iconBgColor, borderColor: iconBorderColor }}
            >
              {intent === 'success' ? (
                <ShoppingCart className="w-5 h-5" style={{ color: iconColor }} />
              ) : (
                <Trash2 className="w-5 h-5" style={{ color: iconColor }} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-gray-900">{title}</p>
              {description ? (
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                  {description}
                </p>
              ) : null}

              <div className="mt-2 flex items-center gap-3">
                <Link
                  href="/carrito"
                  className="text-xs font-semibold transition-colors"
                  style={{ color: intent === 'success' ? '#047857' : '#b91c1c' }}
                  onClick={() => toast.dismiss(t.id)}
                >
                  Ver carrito
                </Link>
                <button
                  type="button"
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                  onClick={() => toast.dismiss(t.id)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        id: toastId,
        duration: 3500,
      }
    )
  }

  // Cargar carrito del localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart) as CartItem[]
        const sanitized = Array.isArray(parsed)
          ? parsed
              .filter((i) => i && typeof i.id === 'number')
              .map((i) => {
                const maxAllowed = Math.max(0, i.stock ?? 0)
                const qty = Math.max(1, Math.floor(i.quantity ?? 1))
                return { ...i, quantity: Math.min(qty, maxAllowed || 1) }
              })
          : []

        setItems(sanitized)
      } catch (error) {
        console.error('Error loading cart:', error)
      }
    }
  }, [])

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    const qty = Math.max(1, Math.floor(quantity))

    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id)
      const maxAllowed = Math.max(0, item.stock ?? 0)

      if (maxAllowed <= 0) {
        showCartToast({
          intent: 'danger',
          title: 'Sin stock',
          description: item.name,
          toastId: `cart-stock-0-${item.id}`,
        })
        return prevItems
      }
      
      if (existingItem) {
        const desired = existingItem.quantity + qty
        const nextQty = Math.min(desired, maxAllowed)
        const delta = nextQty - existingItem.quantity

        if (delta <= 0) {
          showCartToast({
            intent: 'danger',
            title: `Stock insuficiente (disponible: ${maxAllowed})`,
            description: item.name,
            toastId: `cart-max-${item.id}`,
          })
          return prevItems
        }

        showCartToast({
          intent: 'success',
          title: 'Cantidad actualizada en el carrito',
          description: `${item.name} (+${delta})`,
          toastId: `cart-add-${item.id}`,
        })
        return prevItems.map((i) =>
          i.id === item.id
            ? { ...i, ...item, quantity: nextQty }
            : i
        )
      } else {
        const firstQty = Math.min(qty, maxAllowed)
        showCartToast({
          intent: 'success',
          title: 'Producto agregado al carrito',
          description: `${firstQty} × ${item.name}`,
          toastId: `cart-add-${item.id}`,
        })
        return [...prevItems, { ...item, quantity: firstQty }]
      }
    })
  }

  const removeItem = (id: number) => {
    setItems((prevItems) => {
      const removed = prevItems.find((i) => i.id === id)
      if (removed) {
        showCartToast({
          intent: 'danger',
          title: 'Producto eliminado del carrito',
          description: removed.name,
          toastId: `cart-remove-${removed.id}`,
        })
      }
      return prevItems.filter((i) => i.id !== id)
    })
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) {
      removeItem(id)
      return
    }

    setItems((prevItems) => {
      const item = prevItems.find((i) => i.id === id)
      if (!item) return prevItems

      const maxAllowed = Math.max(0, item.stock ?? 0)
      if (maxAllowed <= 0) {
        return prevItems.filter((i) => i.id !== id)
      }

      const nextQty = Math.min(Math.floor(quantity), maxAllowed)
      if (nextQty !== quantity) {
        toast.error(`Máximo ${maxAllowed} unidades para "${item.name}"`)
      }

      return prevItems.map((i) =>
        i.id === id ? { ...i, quantity: nextQty } : i
      )
    })
  }

  const clearCart = (options?: { silent?: boolean }) => {
    setItems([])
    if (!options?.silent) {
      toast.success('Carrito vaciado', { id: 'cart-cleared' })
    }
  }

  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemsCount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}




