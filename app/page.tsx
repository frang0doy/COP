import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import ProductsPreview from '@/components/landing/ProductsPreview'
import Testimonials from '@/components/landing/Testimonials'
import CTA from '@/components/landing/CTA'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <ProductsPreview />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  )
}




