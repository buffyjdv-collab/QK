import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requirePermission,
  ok,
  fail,
  scopeRestaurantId,
  writeAudit,
} from '@/lib/api-helpers'
import { menuCategorySchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

async function getCategoryOr404(id: string, restaurantId: string | null) {
  const cat = await db.menuCategory.findUnique({ where: { id } })
  if (!cat) return null
  if (restaurantId && cat.restaurantId !== restaurantId) return null
  return cat
}

// PATCH /api/admin/menu/categories/[id]
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission('menu.update')
  if (error) return error
  if (!user) return fail('Unauthorized', 401)
  const { id } = await ctx.params
  const restaurantId = scopeRestaurantId(user, req.nextUrl.searchParams.get('restaurantId'))
  const cat = await getCategoryOr404(id, restaurantId)
  if (!cat) return fail('Category not found.', 404)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }
  const parsed = menuCategorySchema.partial().safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || 'Invalid input.', 422)
  }
  const updated = await db.menuCategory.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description || null }
        : {}),
      ...(parsed.data.icon !== undefined ? { icon: parsed.data.icon || null } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
    },
  })
  writeAudit(user, 'UPDATE', 'MENU_CATEGORY', id, parsed.data)
  return ok(updated)
}

// DELETE /api/admin/menu/categories/[id]
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission('menu.delete')
  if (error) return error
  if (!user) return fail('Unauthorized', 401)
  const { id } = await ctx.params
  const restaurantId = scopeRestaurantId(user, req.nextUrl.searchParams.get('restaurantId'))
  const cat = await getCategoryOr404(id, restaurantId)
  if (!cat) return fail('Category not found.', 404)
  // Check for menu items — refuse delete if items exist
  const itemCount = await db.menuItem.count({ where: { categoryId: id } })
  if (itemCount > 0) {
    return fail(
      `Cannot delete category with ${itemCount} item(s). Move items to another category first.`,
      409,
    )
  }
  await db.menuCategory.delete({ where: { id } })
  writeAudit(user, 'DELETE', 'MENU_CATEGORY', id, { name: cat.name })
  return ok({ deleted: true })
}
