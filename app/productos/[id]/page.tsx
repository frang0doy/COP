import ProductDetail from '@/components/products/ProductDetail'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> | { id: string } 
}) {
  // Handle both sync and async params for compatibility
  const resolvedParams = await Promise.resolve(params)
  
  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <ProductDetail productId={resolvedParams.id} />
      <Footer />
    </main>
  )
}

