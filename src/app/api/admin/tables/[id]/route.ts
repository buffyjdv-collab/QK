import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requirePermission,
  ok,
  fail,
  scopeRestaurantId,
  writeAudit,
} from '@/lib/api-helpers'
import { tableSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

async function getTableOr404(id: string, restaurantId: string | null) {
  const t = await db.table.findUnique({ where: { id } })
  if (!t) return null
  if (restaurantId && t.restaurantId !== restaurantId) return null
  return t
}

// PATCH /api/admin/tables/[id]
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission('tables.manage')
  if (error) return error
  if (!user) return fail('Unauthorized', 401)
  const { id } = await ctx.params
  const restaurantId = scopeRestaurantId(user, req.nextUrl.searchParams.get('restaurantId'))
  const table = await getTableOr404(id, restaurantId)
  if (!table) return fail('Table not found.', 404)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }
  const parsed = tableSchema.partial().safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || 'Invalid input.', 422)
  }
  const data = parsed.data

  // If number changed, ensure uniqueness
  if (data.number && data.number !== table.number) {
    const existing = await db.table.findUnique({
      where: {
        restaurantId_number: {
          restaurantId: table.restaurantId,
          number: data.number,
        },
      },
    })
    if (existing) return fail(`Table ${data.number} already exists.`, 409)
  }

  const updated = await db.table.update({
    where: { id },
    data: {
      ...(data.number !== undefined ? { number: data.number } : {}),
      ...(data.label !== undefined ? { label: data.label || null } : {}),
      ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.branchId !== undefined ? { branchId: data.branchId || null } : {}),
    },
  })
  writeAudit(user, 'UPDATE', 'TABLE', id, data)
  return ok(updated)
}

// DELETE /api/admin/tables/[id]
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission('tables.manage')
  if (error) return error
  if (!user) return fail('Unauthorized', 401)
  const { id } = await ctx.params
  const restaurantId = scopeRestaurantId(user, req.nextUrl.searchParams.get('restaurantId'))
  const table = await getTableOr404(id, restaurantId)
  if (!table) return fail('Table not found.', 404)
  await db.table.delete({ where: { id } })
  writeAudit(user, 'DELETE', 'TABLE', id, { number: table.number })
  return ok({ deleted: true })
}
