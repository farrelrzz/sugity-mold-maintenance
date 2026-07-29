import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        })

        if (!user) {
          // Log failed attempt (user not found)
          await prisma.auditLog.create({
            data: {
              aktivitas: `Percobaan login gagal (Username tidak ditemukan: ${credentials.username})`
            }
          })
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) {
          // Log failed attempt (wrong password)
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              aktivitas: `Percobaan login gagal (Password salah)`
            }
          })
          return null
        }

        // Log successful login
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            aktivitas: `Login sebagai ${user.nama} (${user.role})`
          }
        })

        return {
          id: String(user.id),
          name: user.nama,
          username: user.username,
          role: user.role,
          factory: user.factory,
          shift: user.shift,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 jam — 1 shift
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
        token.role = (user as any).role
        token.factory = (user as any).factory
        token.shift = (user as any).shift
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as string
        session.user.factory = token.factory as string
        session.user.shift = token.shift as string | null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Helper: ambil role user dari session
export function getRole(session: any): string | null {
  return session?.user?.role ?? null
}

// Helper: cek apakah user punya role tertentu
export function hasRole(session: any, ...roles: string[]): boolean {
  const role = getRole(session)
  return role !== null && roles.includes(role)
}
