import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    requireSuperAdmin(session)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const restaurant = await db.restaurant.findUnique({ where: { id } })
  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Restore to ACTIVE (or TRIALING if trial still valid)
  const newStatus =
    restaurant.plan === 'TRIAL' &&
    restaurant.trialEndsAt &&
    new Date(restaurant.trialEndsAt).getTime() > Date.now()
      ? 'TRIALING'
      : 'ACTIVE'

  const updated = await db.restaurant.update({
    where: { id },
    data: {
      suspendedAt: null,
      suspendedReason: null,
      subscriptionStatus: newStatus,
    },
  })

  await db.subscription.updateMany({
    where: { restaurantId: id },
    data: { status: newStatus },
  })

  await db.auditLog.create({
    data: {
      restaurantId: id,
      userId: (session.user as any).id,
      action: 'STATUS_CHANGE',
      entity: 'RESTAURANT',
      entityId: id,
      details: JSON.stringify({ action: 'ACTIVATE' }),
    },
  })

  return NextResponse.json({ success: true, data: updated })
}
