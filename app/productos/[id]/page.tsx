import ProductDetail from '@/components/products/ProductDetail'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <ProductDetail productId={params.id} />
      <Footer />
    </main>
  )
}

