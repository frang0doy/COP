import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import ProductsPreview from '@/components/landing/ProductsPreview'
import VideoShowcase from '@/components/landing/VideoShowcase'
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
      <VideoShowcase src="/videos/video%20nuevo%20estucado.mp4" />
      <CTA />
      <Footer />
    </main>
  )
}




