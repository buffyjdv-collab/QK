import { DefaultSession } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'
import type { Role } from '@/lib/types'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      restaurantId?: string
      branchId?: string
      restaurantName?: string | null
      restaurantSlug?: string | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    restaurantId?: string
    branchId?: string
    restaurantName?: string | null
    restaurantSlug?: string | null
  }
}
