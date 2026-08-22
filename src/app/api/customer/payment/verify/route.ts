import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  fail,
  ok,
  generateInvoiceNumber,
  restaurantPrefix,
} from '@/lib/api-helpers'
import { verifyPaymentSchema } from '@/lib/validations'
import { publishRealtime } from '@/lib/realtime-server'

export const dynamic = 'force-dynamic'

// POST /api/customer/payment/verify
// Server ALWAYS decides the final payment status. We simulate a
// verification step here (no real gateway) and mark the payment as PAID
// only if the providerTxnId matches what we issued.
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail('Invalid JSON body.', 400)
  }
  const parsed = verifyPaymentSchema.safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || 'Invalid input.', 422)
  }
  const input = parsed.data

  const payment = await db.payment.findUnique({
    where: { id: input.paymentId },
    include: { order: { include: { restaurant: true, table: true, customer: true } } },
  })
  if (!payment) return fail('Payment not found.', 404)
  if (payment.providerTxnId !== input.providerTxnId) {
    return fail('Provider transaction ID mismatch.', 400)
  }
  if (payment.status === 'PAID') {
    return ok({ payment, alreadyPaid: true })
  }

  // Mark payment as PAID + verified
  const updated = await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'PAID',
      verifiedAt: new Date(),
      failureReason: null,
    },
    include: { order: { include: { restaurant: true, table: true, customer: true } } },
  })

  const order = updated.order
  // Update order paymentStatus
  await db.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'PAID',
      paymentMethod: payment.method,
      // If order was already SERVED, mark COMPLETED
      ...(order.status === 'SERVED'
        ? { status: 'COMPLETED', completedAt: new Date() }
        : {}),
    },
  })

  // Mark platform fee as COLLECTED
  await db.platformFee.updateMany({
    where: { orderId: order.id, status: 'PENDING' },
    data: { status: 'COLLECTED', collectedAt: new Date() },
  })

  // Generate invoice if not exists
  let invoice = await db.invoice.findFirst({ where: { orderId: order.id } })
  if (!invoice) {
    const invoiceCount = await db.invoice.count({
      where: { restaurantId: order.restaurantId },
    })
    const prefix = restaurantPrefix(order.restaurant.name)
    const invoiceNumber = generateInvoiceNumber(prefix, invoiceCount)
    invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurant.name,
        restaurantAddress: order.restaurant.address,
        restaurantGst: order.restaurant.gstNumber,
        restaurantPhone: order.restaurant.phone,
        tableNumber: order.table.number,
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        serviceCharge: order.serviceCharge,
        discountAmount: order.discountAmount,
        grandTotal: order.grandTotal,
        paymentMethod: payment.method,
        paymentStatus: 'PAID',
        customerName: order.customer?.name || null,
        customerPhone: order.customer?.phone || null,
      },
    })
  }

  publishRealtime('payment:confirmed', {
    restaurantId: order.restaurantId,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      amount: payment.amount,
      method: payment.method,
      status: 'PAID',
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    },
  })

  return ok({
    payment: updated,
    invoice,
    orderCompleted: order.status === 'SERVED',
  })
}
