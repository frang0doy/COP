import OrdersList from '@/components/orders/OrdersList'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function PedidosPage() {
  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mis Pedidos</h1>
        <OrdersList />
      </div>
      <Footer />
    </main>
  )
}

