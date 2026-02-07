import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import ScrollProgress from '@/components/layout/ScrollProgress'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CountryGate from '@/components/country/CountryGate'

export const dynamic = 'force-dynamic'

const inter = Inter({
  subsets: ['latin'], 
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'COP - Materiales de Construcción | Líder en México',
  description: 'COP, líder en materiales de construcción en México. Encuentra pinturas, revestimientos y materiales de alta calidad para profesionales.',
  keywords: 'materiales construcción, pinturas, revestimientos, México, construcción',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  let initialGateOpen = true

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { country: true },
    })
    initialGateOpen = !user?.country
  }

  return (
    <html lang="es" className={inter.variable}>
      <body>
        <Providers>
          <CountryGate initialGateOpen={initialGateOpen} />
          <ScrollProgress />
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  )
}

