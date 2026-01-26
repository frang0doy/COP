import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin'

// Defaults para desarrollo (evita warnings y hace el proyecto más “plug & play”)
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = 'dev-secret-change-me'
}
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase()
        const password = credentials?.password

        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        // Admin lock: solo los emails en ADMIN_EMAILS pueden ser ADMIN.
        const shouldBeAdmin = isAdminEmail(email)
        if (shouldBeAdmin && user.role !== 'ADMIN') {
          await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' as any } })
        } else if (!shouldBeAdmin && user.role === 'ADMIN') {
          // Si alguien se dio rol por DB, lo degradamos al loguear.
          await prisma.user.update({ where: { id: user.id }, data: { role: 'USER' as any } })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: shouldBeAdmin ? 'ADMIN' : 'USER',
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = (user as any).id
      if (user && (user as any).role) (token as any).role = (user as any).role
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id as string
        ;(session.user as any).role = (token as any).role
      }
      return session
    },
  },
}

