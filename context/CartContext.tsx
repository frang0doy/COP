'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import toast from 'react-hot-toast'

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
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  itemsCount: number
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Cargar carrito del localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart:', error)
      }
    }
  }, [])

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id)
      
      if (existingItem) {
        toast.success('Cantidad actualizada en el carrito')
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: existingItem.quantity + 1 } : i
        )
      } else {
        toast.success('Producto agregado al carrito')
        return [...prevItems, { ...item, quantity: 1 }]
      }
    })
  }

  const removeItem = (id: number) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== id))
    toast.success('Producto eliminado del carrito')
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) {
      removeItem(id)
      return
    }

    setItems((prevItems) => {
      const item = prevItems.find((i) => i.id === id)
      if (!item) return prevItems

      return prevItems.map((i) =>
        i.id === id ? { ...i, quantity } : i
      )
    })
  }

  const clearCart = () => {
    setItems([])
    toast.success('Carrito vaciado')
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




