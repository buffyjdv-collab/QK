import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'
import type { Role } from '@/lib/types'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role | string
  restaurantId?: string | null
  branchId?: string | null
  restaurantName?: string | null
  restaurantSlug?: string | null
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  const u = session.user as SessionUser
  if (!u.id || !u.role) return null
  return u
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status })
}

/**
 * Returns the session user or a 401 response.
 */
export async function requireAuth(): Promise<SessionUser | null> {
  const u = await getSessionUser()
  return u
}

export function unauthorized() {
  return fail('Unauthorized — please sign in.', 401)
}

export function forbidden(detail = 'You do not have permission to perform this action.') {
  return fail(detail, 403)
}

/**
 * Returns the restaurantId scope for the current user.
 * SUPER_ADMIN can override via `restaurantId` query param; others
 * are pinned to their own restaurantId.
 */
export function scopeRestaurantId(
  user: SessionUser,
  override?: string | null,
): string | null {
  if (user.role === 'SUPER_ADMIN') {
    return override || null
  }
  return user.restaurantId || null
}

export async function requirePermission(permission: string) {
  const user = await getSessionUser()
  if (!user) return { user: null, error: unauthorized() }
  if (!hasPermission(user.role as string, permission)) {
    return { user: null, error: forbidden() }
  }
  return { user, error: null }
}

export function inr(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function generateOrderNumber(prefix: string, count: number): string {
  // e.g. SG-000001
  const padded = String(count + 1).padStart(6, '0')
  return `${prefix}-${padded}`
}

export function generateInvoiceNumber(prefix: string, count: number): string {
  const padded = String(count + 1).padStart(6, '0')
  return `${prefix}-INV-${padded}`
}

export function generateToken(prefix: string, length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < length; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${prefix}-${s}`
}

export function restaurantPrefix(name: string): string {
  const words = name.trim().split(/\s+/)
  const init = words
    .slice(0, 2)
    .map((w) => w.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase())
    .join('')
  return init || 'ORD'
}

export async function writeAudit(
  user: SessionUser | null,
  action: string,
  entity: string,
  entityId: string | null,
  details?: Record<string, unknown>,
) {
  try {
    const { db } = await import('@/lib/db')
    await db.auditLog.create({
      data: {
        restaurantId: user?.restaurantId || null,
        userId: user?.id || null,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
      },
    })
  } catch {
    // best-effort
  }
}
