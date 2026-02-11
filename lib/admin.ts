export function getAdminEmails(): string[] {
  // Admin principal (dueño del proyecto). Debe poder entrar siempre.
  const owner = 'franciscogodoy_@hotmail.com'

  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  // Requisito: solo 2 admins (vos y el cliente).
  // Siempre incluimos al owner, y completamos con el/los emails del env.
  const unique = Array.from(new Set([owner, ...list].map((e) => e.trim().toLowerCase()).filter(Boolean)))

  // En producción respetamos el máximo de 2 sin romper la app: owner + 1 extra.
  return unique.slice(0, 2)
}

export function isAdminEmail(email?: string | null): boolean {
  const e = (email || '').trim().toLowerCase()
  if (!e) return false
  return getAdminEmails().includes(e)
}

