import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { fail, ok } from '@/lib/api-helpers'
import { initiatePaymentSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

// POST /api/customer/payment/initiate
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }
  const parsed = initiatePaymentSchema.safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || 'Invalid input.', 422)
  }
  const input = parsed.data

  const order = await db.order.findUnique({
    where: { id: input.orderId },
    include: { restaurant: true },
  })
  if (!order) return fail('Order not found.', 404)

  // Method allowed by restaurant?
  const r = order.restaurant
  if (input.method === 'UPI' && !r.acceptUpi)
    return fail('UPI payments are not accepted.', 403)
  if (input.method === 'CARD' && !r.acceptCard)
    return fail('Card payments are not accepted.', 403)
  // WALLET treated like UPI for acceptance

  // Create payment record with status PROCESSING
  const providerTxnId = `MOCK-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase()}`
  const payment = await db.payment.create({
    data: {
      orderId: order.id,
      restaurantId: order.restaurantId,
      method: input.method,
      status: 'PROCESSING',
      amount: order.grandTotal,
      currency: r.currency,
      provider: 'MOCK',
      providerTxnId,
      idempotencyKey: `pay-${order.id}-${Date.now()}`,
    },
  })

  // Update order payment status to PROCESSING + method
  await db.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'PROCESSING',
      paymentMethod: input.method,
    },
  })

  return ok({
    paymentId: payment.id,
    providerTxnId,
    amount: order.grandTotal,
    currency: r.currency,
    method: input.method,
    // Mock: tell client to "verify" in 2 seconds
    verifyInMs: 1500,
  })
}
