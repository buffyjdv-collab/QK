import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, ok, fail, scopeRestaurantId } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

// GET /api/admin/audit-logs?page=&pageSize=
export async function GET(req: NextRequest) {
  const { user, error } = await requirePermission('settings.manage')
  if (error) return error
  if (!user) return fail('Unauthorized', 401)
  const restaurantId = scopeRestaurantId(user, req.nextUrl.searchParams.get('restaurantId'))

  const sp = req.nextUrl.searchParams
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(sp.get('pageSize') || '50', 10)),
  )
  const entity = sp.get('entity')

  const where: Record<string, unknown> = {}
  if (restaurantId) where.restaurantId = restaurantId
  if (entity) where.entity = entity

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        restaurant: { select: { id: true, name: true } },
      },
    }),
    db.auditLog.count({ where }),
  ])
  return ok({
    logs,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  })
}
