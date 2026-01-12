import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import ScrollProgress from '@/components/layout/ScrollProgress'
import PageTransitions from '@/components/ui/PageTransitions'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <Providers>
          <ScrollProgress />
          <PageTransitions>{children}</PageTransitions>
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  )
}

