import ProductsList from '@/components/products/ProductsList'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function ProductosPage() {
  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-4 py-10 md:py-12">
        <ProductsList />
      </div>
      <Footer />
    </main>
  )
}

