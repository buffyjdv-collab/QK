import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requirePermission,
  ok,
  fail,
  scopeRestaurantId,
  writeAudit,
} from '@/lib/api-helpers'
import { modifierGroupSchema, modifierSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

async function getGroupOr404(id: string, restaurantId: string | null) {
  const g = await db.modifierGroup.findUnique({
    where: { id },
    include: { modifiers: true },
  })
  if (!g) return null
  if (restaurantId && g.restaurantId !== restaurantId) return null
  return g
}

// PATCH /api/admin/menu/modifier-groups/[id]
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission('menu.update')
  if (error) return error
  if (!user) return fail('Unauthorized', 401)
  const { id } = await ctx.params
  const restaurantId = scopeRestaurantId(user, req.nextUrl.searchParams.get('restaurantId'))
  const group = await getGroupOr404(id, restaurantId)
  if (!group) return fail('Modifier group not found.', 404)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }
  // Allow partial update + nested modifiers array
  const partial = modifierGroupSchema.partial().safeParse(body)
  const modsRaw = Array.isArray((body as any)?.modifiers) ? (body as any).modifiers : null

  if (!partial.success && !modsRaw) {
    return fail(partial.error?.issues?.[0]?.message || 'Invalid input.', 422)
  }
  const data = partial.success ? partial.data : {}

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.modifierGroup.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description || null }
          : {}),
        ...(data.selectionType !== undefined ? { selectionType: data.selectionType } : {}),
        ...(data.required !== undefined ? { required: data.required } : {}),
        ...(data.minSelection !== undefined ? { minSelection: data.minSelection } : {}),
        ...(data.maxSelection !== undefined ? { maxSelection: data.maxSelection } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.menuItemId !== undefined ? { menuItemId: data.menuItemId || null } : {}),
      },
    })
    if (modsRaw) {
      const validMods = (modsRaw as any[])
        .map((m) => modifierSchema.safeParse(m))
        .filter((r) => r.success)
        .map((r) => r.data!)
      const incomingIds = new Set(
        validMods.filter((m) => m.id).map((m) => m.id as string),
      )
      await tx.modifier.deleteMany({
        where: {
          groupId: id,
          ...(incomingIds.size > 0 ? { id: { notIn: Array.from(incomingIds) } } : {}),
        },
      })
      for (let idx = 0; idx < validMods.length; idx++) {
        const m = validMods[idx]
        if (m.id) {
          await tx.modifier.update({
            where: { id: m.id },
            data: {
              name: m.name,
              price: m.price,
              isDefault: m.isDefault ?? false,
              active: m.active ?? true,
              sortOrder: m.sortOrder ?? idx,
            },
          })
        } else {
          await tx.modifier.create({
            data: {
              groupId: id,
              name: m.name,
              price: m.price,
              isDefault: m.isDefault ?? false,
              active: m.active ?? true,
              sortOrder: m.sortOrder ?? idx,
            },
          })
        }
      }
    }
    return tx.modifierGroup.findUnique({
      where: { id },
      include: { modifiers: { orderBy: { sortOrder: 'asc' } } },
    })
  })
  writeAudit(user, 'UPDATE', 'MODIFIER_GROUP', id, data)
  return ok(updated)
}

// DELETE /api/admin/menu/modifier-groups/[id]
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission('menu.delete')
  if (error) return error
  if (!user) return fail('Unauthorized', 401)
  const { id } = await ctx.params
  const restaurantId = scopeRestaurantId(user, req.nextUrl.searchParams.get('restaurantId'))
  const group = await getGroupOr404(id, restaurantId)
  if (!group) return fail('Modifier group not found.', 404)
  await db.modifierGroup.delete({ where: { id } })
  writeAudit(user, 'DELETE', 'MODIFIER_GROUP', id, { name: group.name })
  return ok({ deleted: true })
}
