export function getAdminEmails(): string[] {
  // Admin principal (dueño del proyecto). Debe poder entrar siempre.
  const owner = 'franciscogodoy_@hotmail.com'

  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  // Siempre incluimos al owner y completamos con TODOS los emails del env.
  // Si agregás más de uno en ADMIN_EMAILS (separados por coma), todos tienen acceso admin.
  const unique = Array.from(
    new Set([owner, ...list].map((e) => e.trim().toLowerCase()).filter(Boolean))
  )
  return unique
}

export function isAdminEmail(email?: string | null): boolean {
  const e = (email || '').trim().toLowerCase()
  if (!e) return false
  return getAdminEmails().includes(e)
}

