import ProfilePage from '@/components/profile/ProfilePage'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function PerfilPage() {
  return (
    <main className="min-h-screen pt-16 bg-gray-100">
      <Navbar />
      <ProfilePage />
      <Footer />
    </main>
  )
}

