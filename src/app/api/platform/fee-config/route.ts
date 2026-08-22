import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/tenant'
import { describeFeeConfig } from '@/lib/platform-fee'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const feeConfigSchema = z.object({
  feeType: z.enum(['PERCENTAGE', 'FIXED_PER_ORDER', 'MONTHLY_SUBSCRIPTION', 'HYBRID']),
  percentageRate: z.number().min(0).max(100),
  fixedAmount: z.number().int().min(0),       // paise
  monthlyAmount: z.number().int().min(0),     // paise
  appliesTo: z.enum([
    'FOOD_SUBTOTAL',
    'DISCOUNTED_SUBTOTAL',
    'TOTAL_EXCLUDING_TAX',
    'TOTAL_INCLUDING_TAX',
  ]),
  minimumFee: z.number().int().min(0),        // paise
  maximumFee: z.number().int().min(0).nullable(),
  payer: z.enum(['RESTAURANT', 'CUSTOMER', 'SPLIT']),
  customerSplitPct: z.number().min(0).max(100),
  active: z.boolean().optional(),
})

/** Get the current platform fee config. */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Allow any signed-in user to read the config (so they can see fees on invoices)
  // — but only super admins can modify it (PATCH below)

  let config = await db.platformFeeConfig.findFirst({
    where: { active: true },
    orderBy: { updatedAt: 'desc' },
  })

  if (!config) {
    // No config yet — return defaults
    return NextResponse.json({
      success: true,
      data: {
        id: null,
        feeType: 'PERCENTAGE',
        percentageRate: 0.5,
        fixedAmount: 0,
        monthlyAmount: 0,
        appliesTo: 'TOTAL_EXCLUDING_TAX',
        minimumFee: 0,
        maximumFee: null,
        payer: 'RESTAURANT',
        customerSplitPct: 0,
        active: true,
        description: '0.5% of total excluding tax. Restaurant pays. min ₹0.00.',
      },
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      ...config,
      description: describeFeeConfig({
        feeType: config.feeType as any,
        percentageRate: config.percentageRate,
        fixedAmount: config.fixedAmount,
        monthlyAmount: config.monthlyAmount,
        appliesTo: config.appliesTo as any,
        minimumFee: config.minimumFee,
        maximumFee: config.maximumFee,
        payer: config.payer as any,
        customerSplitPct: config.customerSplitPct,
      }),
    },
  })
}

/** Update the platform fee config (super admin only). */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    requireSuperAdmin(session)
  } catch {
    return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = feeConfigSchema.parse(body)

    // Deactivate existing configs (we keep only one active)
    await db.platformFeeConfig.updateMany({
      where: { active: true },
      data: { active: false },
    })

    // Create new active config
    const config = await db.platformFeeConfig.create({
      data: {
        feeType: parsed.feeType,
        percentageRate: parsed.percentageRate,
        fixedAmount: parsed.fixedAmount,
        monthlyAmount: parsed.monthlyAmount,
        appliesTo: parsed.appliesTo,
        minimumFee: parsed.minimumFee,
        maximumFee: parsed.maximumFee,
        payer: parsed.payer,
        customerSplitPct: parsed.customerSplitPct,
        active: true,
        updatedById: (session.user as any).id,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'UPDATE',
        entity: 'PLATFORM_FEE_CONFIG',
        entityId: config.id,
        details: JSON.stringify(parsed),
      },
    })

    return NextResponse.json({
      success: true,
      data: config,
      description: describeFeeConfig({
        feeType: config.feeType as any,
        percentageRate: config.percentageRate,
        fixedAmount: config.fixedAmount,
        monthlyAmount: config.monthlyAmount,
        appliesTo: config.appliesTo as any,
        minimumFee: config.minimumFee,
        maximumFee: config.maximumFee,
        payer: config.payer as any,
        customerSplitPct: config.customerSplitPct,
      }),
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issues = (err as any).issues || (err as any).errors || []
      return NextResponse.json(
        { error: issues[0]?.message || 'Invalid input' },
        { status: 400 },
      )
    }
    console.error('[platform/fee-config] error:', err)
    return NextResponse.json({ error: 'Failed to update fee config' }, { status: 500 })
  }
}
