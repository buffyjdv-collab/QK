import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/tenant'
import { resolveDateRange } from '@/lib/date-range'

export const dynamic = 'force-dynamic'

/**
 * Platform Fees Collected — super admin view of fees collected per tenant.
 * Returns: total collected, breakdown by tenant, breakdown by fee type, trend.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    requireSuperAdmin(session)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const range = sp.get('range') || '30d'
  let dateRange
  try {
    dateRange = resolveDateRange(range, sp.get('from'), sp.get('to'))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  const fees = await db.platformFee.findMany({
    where: {
      createdAt: { gte: dateRange.from, lte: dateRange.to },
    },
    select: {
      id: true,
      feeType: true,
      percentageRate: true,
      fixedAmount: true,
      baseAmount: true,
      grossFee: true,
      feeAmount: true,
      payer: true,
      customerPortion: true,
      restaurantPortion: true,
      status: true,
      collectedAt: true,
      createdAt: true,
      restaurantId: true,
      restaurant: {
        select: { id: true, name: true, slug: true, plan: true },
      },
      order: {
        select: { id: true, orderNumber: true, grandTotal: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  // Aggregate by tenant
  const tenantMap = new Map<
    string,
    {
      restaurantId: string
      restaurantName: string
      slug: string
      plan: string
      feeCount: number
      collected: number
      pending: number
      refunded: number
      customerPaid: number
      restaurantPaid: number
    }
  >()

  for (const f of fees) {
    const key = f.restaurantId
    const cur = tenantMap.get(key) || {
      restaurantId: f.restaurantId,
      restaurantName: f.restaurant?.name || 'Unknown',
      slug: f.restaurant?.slug || '',
      plan: f.restaurant?.plan || 'TRIAL',
      feeCount: 0,
      collected: 0,
      pending: 0,
      refunded: 0,
      customerPaid: 0,
      restaurantPaid: 0,
    }
    cur.feeCount += 1
    if (f.status === 'COLLECTED') {
      cur.collected += f.feeAmount
      cur.customerPaid += f.customerPortion
      cur.restaurantPaid += f.restaurantPortion
    } else if (f.status === 'PENDING') {
      cur.pending += f.feeAmount
    } else if (f.status === 'REFUNDED') {
      cur.refunded += f.feeAmount
    }
    tenantMap.set(key, cur)
  }

  const byTenant = Array.from(tenantMap.values())
    .map((t) => ({
      ...t,
      collected: +t.collected.toFixed(2),
      pending: +t.pending.toFixed(2),
      refunded: +t.refunded.toFixed(2),
      customerPaid: +t.customerPaid.toFixed(2),
      restaurantPaid: +t.restaurantPaid.toFixed(2),
    }))
    .sort((a, b) => b.collected - a.collected)

  // Aggregate by fee type
  const feeTypeMap: Record<string, number> = {}
  for (const f of fees) {
    feeTypeMap[f.feeType] = (feeTypeMap[f.feeType] || 0) + f.feeAmount
  }

  // Aggregate by payer
  const payerMap: Record<string, number> = {}
  for (const f of fees) {
    payerMap[f.payer] = (payerMap[f.payer] || 0) + f.feeAmount
  }

  // Total collected
  const totalCollected = fees
    .filter((f) => f.status === 'COLLECTED')
    .reduce((s, f) => s + f.feeAmount, 0)
  const totalPending = fees
    .filter((f) => f.status === 'PENDING')
    .reduce((s, f) => s + f.feeAmount, 0)
  const totalRefunded = fees
    .filter((f) => f.status === 'REFUNDED')
    .reduce((s, f) => s + f.feeAmount, 0)

  return NextResponse.json({
    success: true,
    data: {
      range: dateRange.label,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
      totalCollected: +totalCollected.toFixed(2),
      totalPending: +totalPending.toFixed(2),
      totalRefunded: +totalRefunded.toFixed(2),
      totalFees: fees.length,
      byTenant,
      byFeeType: Object.entries(feeTypeMap).map(([type, amount]) => ({
        feeType: type,
        amount: +amount.toFixed(2),
      })),
      byPayer: Object.entries(payerMap).map(([payer, amount]) => ({
        payer,
        amount: +amount.toFixed(2),
      })),
      recentFees: fees.slice(0, 20).map((f) => ({
        id: f.id,
        feeType: f.feeType,
        feeAmount: f.feeAmount,
        baseAmount: f.baseAmount,
        payer: f.payer,
        status: f.status,
        collectedAt: f.collectedAt,
        createdAt: f.createdAt,
        restaurant: f.restaurant,
        order: f.order,
      })),
    },
  })
}
