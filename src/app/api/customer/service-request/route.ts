import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { fail, ok } from '@/lib/api-helpers'
import { createServiceRequestSchema } from '@/lib/validations'
import { publishRealtime } from '@/lib/realtime-server'

export const dynamic = 'force-dynamic'

// POST /api/customer/service-request
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }
  const parsed = createServiceRequestSchema.safeParse(body)
  if (!parsed.success) {
    return fail(
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      422,
    )
  }
  const input = parsed.data

  const table = await db.table.findUnique({
    where: { qrCodeToken: input.tableToken },
  })
  if (!table) return fail('Invalid or unknown QR code.', 404)

  // If type is REQUEST_BILL, ensure restaurant settings allow it
  if (input.type === 'REQUEST_BILL') {
    const settings = await db.restaurantSettings.findUnique({
      where: { restaurantId: table.restaurantId },
    })
    if (settings && !settings.allowRequestBill) {
      return fail('Bill request is not enabled for this restaurant.', 403)
    }
  }
  if (input.type === 'CALL_WAITER') {
    const settings = await db.restaurantSettings.findUnique({
      where: { restaurantId: table.restaurantId },
    })
    if (settings && !settings.allowCallWaiter) {
      return fail('Calling waiter is not enabled for this restaurant.', 403)
    }
  }

  const sr = await db.serviceRequest.create({
    data: {
      restaurantId: table.restaurantId,
      tableId: table.id,
      orderId: input.orderId || null,
      type: input.type,
      status: 'PENDING',
      notes: input.notes || null,
    },
  })

  // Notification row for waiters
  if (input.type === 'REQUEST_BILL' || input.type === 'CALL_WAITER') {
    await db.notification.create({
      data: {
        restaurantId: table.restaurantId,
        target: 'WAITER',
        type: 'SERVICE_REQUEST',
        title: input.type === 'REQUEST_BILL' ? 'Bill requested' : 'Waiter called',
        message: `Table ${table.number}${
          input.notes ? ` • ${input.notes}` : ''
        }`,
        tableId: table.id,
      },
    })
  }

  publishRealtime('service:new', {
    restaurantId: table.restaurantId,
    payload: {
      requestId: sr.id,
      tableId: table.id,
      tableNumber: table.number,
      type: sr.type,
      notes: sr.notes,
      createdAt: sr.createdAt,
    },
  })

  return ok(sr, 201)
}
