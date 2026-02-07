'use client'

import { SessionProvider } from 'next-auth/react'
import { CartProvider } from '@/context/CartContext'
import CountryGate from '@/components/layout/CountryGate'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <CountryGate />
        {children}
      </CartProvider>
    </SessionProvider>
  )
}

