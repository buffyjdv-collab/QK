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

// PATCH /api/admin/service-requests/[id]  { status: 'ACKNOWLEDGED'|'COMPLETED', handledById? }
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission('orders.update_status')
  if (error) return error
  if (!user) return fail('Unauthorized', 401)
  const { id } = await ctx.params
  const restaurantId = scopeRestaurantId(user, req.nextUrl.searchParams.get('restaurantId'))

  const sr = await db.serviceRequest.findUnique({ where: { id } })
  if (!sr) return fail('Service request not found.', 404)
  if (restaurantId && sr.restaurantId !== restaurantId) {
    return fail('Service request not found.', 404)
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }
  const status = body?.status
  if (!['ACKNOWLEDGED', 'COMPLETED'].includes(status)) {
    return fail('Invalid status.', 422)
  }

  const updated = await db.serviceRequest.update({
    where: { id },
    data: {
      status,
      handledById: user.id,
      resolvedAt: status === 'COMPLETED' ? new Date() : null,
    },
  })
  writeAudit(user, 'UPDATE', 'SERVICE_REQUEST', id, { status })
  return ok(updated)
}
