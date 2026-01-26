export function getAdminEmails(): string[] {
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  // Requisito: solo 2 admins (vos y el cliente).
  const unique = Array.from(new Set(list))

  if (process.env.NODE_ENV === 'production' && unique.length > 2) {
    throw new Error('ADMIN_EMAILS debe contener como máximo 2 emails en producción')
  }

  return unique.slice(0, 2)
}

export function isAdminEmail(email?: string | null): boolean {
  const e = (email || '').trim().toLowerCase()
  if (!e) return false
  return getAdminEmails().includes(e)
}

