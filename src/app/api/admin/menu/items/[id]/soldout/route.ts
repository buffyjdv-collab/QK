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

// PATCH /api/admin/menu/items/[id]/soldout  { soldOut: boolean }
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission('menu.update')
  if (error) return error
  if (!user) return fail('Unauthorized', 401)
  const { id } = await ctx.params
  const restaurantId = scopeRestaurantId(user, req.nextUrl.searchParams.get('restaurantId'))
  const item = await db.menuItem.findUnique({ where: { id } })
  if (!item) return fail('Menu item not found.', 404)
  if (restaurantId && item.restaurantId !== restaurantId) {
    return fail('Menu item not found.', 404)
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }
  const soldOut = Boolean(body?.soldOut)
  const updated = await db.menuItem.update({
    where: { id },
    data: { soldOut },
  })
  writeAudit(user, 'UPDATE', 'MENU_ITEM', id, { soldOut })
  return ok(updated)
}
