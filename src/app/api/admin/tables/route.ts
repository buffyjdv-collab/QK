import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requirePermission,
  ok,
  fail,
  scopeRestaurantId,
  writeAudit,
  generateToken,
} from '@/lib/api-helpers'
import { tableSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

// GET /api/admin/tables
export async function GET(req: NextRequest) {
  const { user, error } = await requirePermission('dashboard.view')
  if (error) return error
  if (!user) return fail('Unauthorized', 401)
  const restaurantId = scopeRestaurantId(user, req.nextUrl.searchParams.get('restaurantId'))
  const tables = await db.table.findMany({
    where: restaurantId ? { restaurantId } : {},
    orderBy: { number: 'asc' },
    include: {
      _count: { select: { orders: true } },
      orders: {
        where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          grandTotal: true,
          placedAt: true,
        },
        orderBy: { placedAt: 'desc' },
        take: 1,
      },
    },
  })
  return ok(tables)
}

// POST /api/admin/tables
export async function POST(req: NextRequest) {
  const { user, error } = await requirePermission('tables.manage')
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
  const parsed = tableSchema.safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || 'Invalid input.', 422)
  }
  const data = parsed.data

  // Uniqueness check on (restaurantId, number)
  const existing = await db.table.findUnique({
    where: { restaurantId_number: { restaurantId, number: data.number } },
  })
  if (existing) return fail(`Table ${data.number} already exists.`, 409)

  const table = await db.table.create({
    data: {
      restaurantId,
      branchId: data.branchId || null,
      number: data.number,
      label: data.label || null,
      capacity: data.capacity,
      active: data.active ?? true,
      qrCodeToken: generateToken(`t-${data.number.toLowerCase()}`),
      status: 'AVAILABLE',
    },
  })
  writeAudit(user, 'CREATE', 'TABLE', table.id, { number: table.number })
  return ok(table, 201)
}
