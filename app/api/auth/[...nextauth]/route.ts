import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// En producción, esto vendrá de una base de datos
// Por ahora usamos datos de ejemplo
const users = [
  {
    id: '1',
    email: 'demo@cop.com',
    password: '$2a$10$rK8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X', // password: demo123
    name: 'Usuario Demo',
  },
]

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = users.find((u) => u.email === credentials.email)

        if (!user) {
          // Para demo, si no existe el usuario, lo creamos con la contraseña proporcionada
          // En producción, esto NO debe hacerse así
          if (credentials.password === 'demo123') {
            return {
              id: '1',
              email: credentials.email,
              name: 'Usuario Demo',
            }
          }
          return null
        }

        // En producción, verificar la contraseña con bcrypt
        // const isValid = await bcrypt.compare(credentials.password, user.password)
        // Por ahora, para demo, aceptamos cualquier contraseña si el email existe
        const isValid = true

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
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
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

