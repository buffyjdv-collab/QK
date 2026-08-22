import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requirePermission,
  ok,
  fail,
  scopeRestaurantId,
  writeAudit,
} from '@/lib/api-helpers'
import { modifierGroupSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

// GET /api/admin/menu/modifier-groups
export async function GET(req: NextRequest) {
  const { user, error } = await requirePermission('dashboard.view')
  if (error) return error
  if (!user) return fail('Unauthorized', 401)
  const restaurantId = scopeRestaurantId(user, req.nextUrl.searchParams.get('restaurantId'))
  const groups = await db.modifierGroup.findMany({
    where: restaurantId ? { restaurantId } : {},
    include: {
      modifiers: { orderBy: { sortOrder: 'asc' } },
      menuItem: { select: { id: true, name: true } },
    },
    orderBy: { sortOrder: 'asc' },
  })
  return ok(groups)
}

// POST /api/admin/menu/modifier-groups
export async function POST(req: NextRequest) {
  const { user, error } = await requirePermission('menu.create')
  if (error) return error
  if (!user) return fail('Unauthorized', 401)
  if (user.role !== 'SUPER_ADMIN' && !user.restaurantId) {
    return fail('You are not assigned to a restaurant.', 400)
  }
  const restaurantId = user.restaurantId as string

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }
  const parsed = modifierGroupSchema.safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || 'Invalid input.', 422)
  }
  const data = parsed.data

  // Validate menuItemId belongs to restaurant if provided
  if (data.menuItemId) {
    const item = await db.menuItem.findUnique({ where: { id: data.menuItemId } })
    if (!item || item.restaurantId !== restaurantId) {
      return fail('Invalid menu item for modifier group.', 422)
    }
  }

  const group = await db.modifierGroup.create({
    data: {
      restaurantId,
      menuItemId: data.menuItemId || null,
      name: data.name,
      description: data.description || null,
      selectionType: data.selectionType,
      required: data.required ?? false,
      minSelection: data.minSelection ?? 0,
      maxSelection: data.maxSelection ?? (data.selectionType === 'SINGLE' ? 1 : 5),
      sortOrder: data.sortOrder ?? 0,
      modifiers: data.modifiers?.length
        ? {
            create: data.modifiers.map((m, idx) => ({
              name: m.name,
              price: m.price,
              isDefault: m.isDefault ?? false,
              active: m.active ?? true,
              sortOrder: m.sortOrder ?? idx,
            })),
          }
        : undefined,
    },
    include: {
      modifiers: { orderBy: { sortOrder: 'asc' } },
    },
  })
  writeAudit(user, 'CREATE', 'MODIFIER_GROUP', group.id, { name: group.name })
  return ok(group, 201)
}
