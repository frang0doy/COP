'use client'

import { SessionProvider } from 'next-auth/react'
import { CartProvider } from '@/context/CartContext'
import CountryGate from '@/components/country/CountryGate'

export function Providers({
  children,
  initialGateOpen,
}: {
  children: React.ReactNode
  initialGateOpen?: boolean
}) {
  return (
    <SessionProvider>
      <CartProvider>
        <CountryGate initialGateOpen={initialGateOpen ?? false} />
        {children}
      </CartProvider>
    </SessionProvider>
  )
}

