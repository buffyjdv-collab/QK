// Server-side authentication configuration
// This file contains NextAuth setup with server-only dependencies

import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'

// Re-export permission utilities from the client-safe permissions module
export { 
  ROLE_HIERARCHY, 
  ROLE_LABELS, 
  PERMISSIONS, 
  hasPermission, 
  canAccessRole 
} from '@/lib/permissions'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { restaurant: true, branch: true },
        })
        if (!user || !user.active) return null
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          restaurantId: user.restaurantId,
          branchId: user.branchId,
          restaurantName: user.restaurant?.name,
          restaurantSlug: user.restaurant?.slug,
        } as any
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role
        token.restaurantId = (user as any).restaurantId
        token.branchId = (user as any).branchId
        token.restaurantName = (user as any).restaurantName
        token.restaurantSlug = (user as any).restaurantSlug
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).restaurantId = token.restaurantId
        ;(session.user as any).branchId = token.branchId
        ;(session.user as any).restaurantName = token.restaurantName
        ;(session.user as any).restaurantSlug = token.restaurantSlug
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'spice-garden-quick-order-secret-key-2026-very-long-and-stable-do-not-change',
  // Gracefully handle stale JWT cookies — don't crash the page, just treat as no session
  logger: {
    error(code: string, message: any) {
      if (code === 'JWT_SESSION_ERROR') {
        console.warn('[next-auth] Stale JWT cookie — user will be asked to sign in again.')
        return
      }
      console.error(`[next-auth][${code}]`, message)
    },
  },
}
