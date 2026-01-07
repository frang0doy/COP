import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ContactForm from '@/components/contact/ContactForm'

export default function ContactoPage() {
  return (
    <main className="min-h-screen pt-24 bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ContactForm />
      </div>
      <Footer />
    </main>
  )
}

