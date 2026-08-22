import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requirePermission,
  ok,
  fail,
  scopeRestaurantId,
  writeAudit,
} from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

// GET /api/admin/service-requests
export async function GET(req: NextRequest) {
  const { user, error } = await requirePermission('orders.view')
  if (error) return error
  if (!user) return fail('Unauthorized', 401)
  const restaurantId = scopeRestaurantId(user, req.nextUrl.searchParams.get('restaurantId'))
  const status = req.nextUrl.searchParams.get('status')

  const requests = await db.serviceRequest.findMany({
    where: {
      ...(restaurantId ? { restaurantId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      table: { select: { number: true, label: true } },
      order: { select: { orderNumber: true } },
      handledBy: { select: { id: true, name: true } },
    },
  })
  return ok(requests)
}
