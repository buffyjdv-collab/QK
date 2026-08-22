import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/tenant'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({ reason: z.string().max(280).optional() })

export async function POST(
  req: Request,
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
  let reason = 'Suspended by platform admin'
  try {
    const body = await req.json()
    const parsed = schema.parse(body)
    if (parsed.reason) reason = parsed.reason
  } catch {
    // Body might be empty — that's fine
  }

  const updated = await db.restaurant.update({
    where: { id },
    data: {
      suspendedAt: new Date(),
      suspendedReason: reason,
      subscriptionStatus: 'SUSPENDED',
    },
  })

  await db.subscription.updateMany({
    where: { restaurantId: id },
    data: { status: 'SUSPENDED' },
  })

  await db.auditLog.create({
    data: {
      restaurantId: id,
      userId: (session.user as any).id,
      action: 'STATUS_CHANGE',
      entity: 'RESTAURANT',
      entityId: id,
      details: JSON.stringify({ action: 'SUSPEND', reason }),
    },
  })

  return NextResponse.json({ success: true, data: updated })
}
