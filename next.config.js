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
  webpack: (config, { dev }) => {
    // En Windows/OneDrive el cache en disco de webpack puede corromperse (EPERM/ENOENT),
    // provocando errores de chunks faltantes al navegar (ej: Cannot find module './xxx.js').
    // En dev usamos cache en memoria para evitar locks/renames en .next/cache.
    if (dev) {
      config.cache = { type: 'memory' }
    }
    return config
  },
}

module.exports = nextConfig

