import ProductsList from '@/components/products/ProductsList'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function ProductosPage() {
  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Catálogo de Productos
          </h1>
          <p className="text-lg text-gray-600">
            Explora nuestra amplia gama de materiales de construcción
          </p>
        </div>
        <ProductsList />
      </div>
      <Footer />
    </main>
  )
}

