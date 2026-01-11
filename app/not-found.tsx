import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function NotFound() {
  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-black mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
          <Link
            href="/"
            className="inline-block bg-black text-white px-6 py-3 hover:bg-gray-900 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}


