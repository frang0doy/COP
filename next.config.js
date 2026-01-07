/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    unoptimized: true, // Para evitar problemas con imágenes en Vercel
  },
  // Asegurar que las páginas dinámicas se generen correctamente
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig

