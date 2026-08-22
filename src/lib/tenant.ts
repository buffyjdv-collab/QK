/**
 * Tenant context helpers — used by admin APIs to scope queries.
 *
 * For RESTAURANT_OWNER / MANAGER / etc: tenant = session.user.restaurantId (fixed).
 * For SUPER_ADMIN: tenant = the active tenant selected via the tenant switcher
 *   (passed as `x-tenant-id` header or `?tenantId=` query param).
 *   If none specified, queries span all tenants (platform-wide views).
 */
import { headers } from 'next/headers'
import { db } from '@/lib/db'

export interface TenantContext {
  role: string
  userId: string
  /** The restaurantId to scope queries to. null = platform-wide (super admin only). */
  restaurantId: string | null
  /** True when super admin is impersonating a specific tenant. */
  impersonating: boolean
}

export async function getTenantContext(session: any): Promise<TenantContext> {
  const role = (session?.user as any)?.role as string
  const userId = (session?.user as any)?.id as string
  const sessionRestaurantId = (session?.user as any)?.restaurantId as string | null

  if (role === 'SUPER_ADMIN') {
    // Super admin can specify a tenant via header or query param
    const h = await headers()
    const tenantHeader = h.get('x-tenant-id')
    if (tenantHeader && tenantHeader !== 'all') {
      return { role, userId, restaurantId: tenantHeader, impersonating: true }
    }
    return { role, userId, restaurantId: null, impersonating: false }
  }

  // For all other roles, tenant is fixed by their session
  return {
    role,
    userId,
    restaurantId: sessionRestaurantId ?? null,
    impersonating: false,
  }
}

/** Returns true if the current user can access the given restaurant's data. */
export async function canAccessRestaurant(session: any, restaurantId: string): Promise<boolean> {
  const role = (session?.user as any)?.role as string
  if (role === 'SUPER_ADMIN') return true
  const sessionRestaurantId = (session?.user as any)?.restaurantId as string | null
  return sessionRestaurantId === restaurantId
}

/** Require that the session is a super admin. Throws if not. */
export function requireSuperAdmin(session: any): void {
  const role = (session?.user as any)?.role as string
  if (role !== 'SUPER_ADMIN') {
    throw new Error('Super admin access required')
  }
}

/** Get the restaurant record for the current tenant context. */
export async function getCurrentTenant(ctx: TenantContext) {
  if (!ctx.restaurantId) return null
  return db.restaurant.findUnique({
    where: { id: ctx.restaurantId },
    include: { subscription: true },
  })
}
