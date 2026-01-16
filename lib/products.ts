import type { Product } from '@prisma/client'

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch('/api/products', { cache: 'no-store' })
  if (!res.ok) throw new Error('No se pudieron cargar los productos')
  return (await res.json()) as Product[]
}

export async function fetchProduct(id: number): Promise<Product> {
  const res = await fetch(`/api/products/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('No se pudo cargar el producto')
  return (await res.json()) as Product
}

