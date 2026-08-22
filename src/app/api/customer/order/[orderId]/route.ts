import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { fail, ok } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

// GET /api/customer/order/[orderId]
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await ctx.params
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { modifiers: true, menuItem: { select: { image: true } } },
      },
      table: true,
      payments: true,
      invoices: true,
      customer: true,
      serviceRequests: true,
    },
  })
  if (!order) return fail('Order not found.', 404)
  return ok(order)
}
