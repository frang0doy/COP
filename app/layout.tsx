import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import ScrollProgress from '@/components/layout/ScrollProgress'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import WhatsAppFloatingButton from '@/components/layout/WhatsAppFloatingButton'

export const dynamic = 'force-dynamic'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Cop Recubrimientos',
    template: '%s | Cop Recubrimientos',
  },
  description: 'COP, líder en materiales de construcción en México. Encuentra pinturas, revestimientos y materiales de alta calidad para profesionales.',
  keywords: 'materiales construcción, pinturas, revestimientos, México, construcción',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // WhatsApp empresa. Si no está seteado en env, usamos fallback para que el botón siempre se vea.
  const companyWhatsapp = (
    process.env.NEXT_PUBLIC_COMPANY_WHATSAPP ||
    '5492314577877'
  ).trim()
  const session = await getServerSession(authOptions)
  let initialGateOpen = true

  // Si ya hay país seleccionado en cookie, no mostramos gate (para guests también).
  const cookieCountry = cookies().get('cop.country')?.value
  if (cookieCountry) initialGateOpen = false

  if (session?.user?.id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { country: true },
      })
      // Si el usuario tiene país en DB, no mostramos gate.
      // Si no lo tiene pero ya hay cookie, tampoco bloqueamos (se persiste luego del login).
      initialGateOpen = !user?.country && !cookieCountry
    } catch {
      // Sin DB (Neon caído, sin red, URL local mal configurada): no tumbar el sitio en dev.
      initialGateOpen = !cookieCountry
    }
  }

  return (
    <html lang="es" className={inter.variable}>
      <body>
        <Providers initialGateOpen={initialGateOpen}>
          <ScrollProgress />
          {children}
          <WhatsAppFloatingButton phone={companyWhatsapp} />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4200,
              className:
                'rounded-xl border border-gray-200 bg-white text-gray-900 shadow-xl ring-1 ring-orange-500/10',
              success: {
                className:
                  'rounded-xl border border-green-200 bg-white text-gray-900 shadow-xl ring-1 ring-orange-500/10',
              },
              error: {
                className:
                  'rounded-xl border border-red-200 bg-white text-gray-900 shadow-xl ring-1 ring-orange-500/10',
              },
              loading: {
                className:
                  'rounded-xl border border-orange-200 bg-white text-gray-900 shadow-xl ring-1 ring-orange-500/20',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}

