import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, ok, fail, scopeRestaurantId } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

// GET /api/admin/orders/[id]
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission('orders.view')
  if (error) return error
  if (!user) return fail('Unauthorized', 401)

  const { id } = await ctx.params
  const order = await db.order.findUnique({
    where: { id },
    include: {
      table: true,
      items: {
        include: {
          modifiers: true,
          menuItem: { select: { image: true } },
        },
      },
      payments: true,
      invoices: true,
      customer: true,
      acceptedBy: { select: { id: true, name: true } },
      servedBy: { select: { id: true, name: true } },
      serviceRequests: true,
    },
  })
  if (!order) return fail('Order not found.', 404)
  const restaurantId = scopeRestaurantId(user, req.nextUrl.searchParams.get('restaurantId'))
  if (restaurantId && order.restaurantId !== restaurantId) {
    return fail('Order not found.', 404)
  }
  return ok(order)
}
