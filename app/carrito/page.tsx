import CartPage from '@/components/cart/CartPage'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function CarritoPage() {
  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <CartPage />
      <Footer />
    </main>
  )
}

